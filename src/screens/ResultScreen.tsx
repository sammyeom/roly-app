import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { colors } from '@toss/tds-react-native';
import {
  GoogleAdMob,
  Storage,
  generateHapticFeedback,
  getTossShareLink,
  contactsViral,
  type ShowAdMobEvent,
} from '@apps-in-toss/framework';
import NavigationBar from '../components/NavigationBar';
import { type ResultParams } from '../App';

// ─── Constants ───────────────────────────────────────────────────────────────

// 토스 콘솔에서 발급받은 광고 그룹 ID로 교체하세요
const AD_GROUP_ID = 'YOUR_AD_GROUP_ID';
// 토스 콘솔에서 발급받은 친구초대 모듈 ID로 교체하세요
const VIRAL_MODULE_ID = 'YOUR_VIRAL_MODULE_ID';

const STORAGE_KEY = 'roly-usage';
const DAILY_LIMIT = 5;
const BONUS_PER_AD = 3;

// ─── Types ───────────────────────────────────────────────────────────────────

interface UsageData {
  date: string;
  usedCount: number;
  bonusCount: number;
}

interface ResultScreenProps {
  params: ResultParams;
  onRetry: () => void;
  onHome: () => void;
  onBack: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function loadUsageData(): Promise<UsageData> {
  try {
    const raw = await Storage.getItem(STORAGE_KEY);
    if (raw == null) return { date: getTodayString(), usedCount: 0, bonusCount: 0 };
    const parsed = JSON.parse(raw) as UsageData;
    // 날짜가 바뀌면 카운트 리셋
    if (parsed.date !== getTodayString()) {
      return { date: getTodayString(), usedCount: 0, bonusCount: 0 };
    }
    return parsed;
  } catch {
    return { date: getTodayString(), usedCount: 0, bonusCount: 0 };
  }
}

async function saveUsageData(data: UsageData): Promise<void> {
  try {
    await Storage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // 저장 실패는 조용히 처리
  }
}

// ─── ResultScreen ─────────────────────────────────────────────────────────────

export default function ResultScreen({ params, onRetry, onHome, onBack }: ResultScreenProps) {
  const { result, spinParams } = params;
  const isNumber = spinParams.mode === 'number';

  // 등장 애니메이션
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // 🎉 이모지 반복 애니메이션
  const emojiScale = useRef(new Animated.Value(1)).current;

  // 광고 / 사용량 상태
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // ─── Mount: 등장 애니메이션 + 햅틱 + 사용량 체크 ──────────────────────────

  useEffect(() => {
    // 등장 애니메이션
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // 🎉 이모지 반복 애니메이션 (scale 1.0 → 1.3 → 1.0 루프)
    const emojiLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(emojiScale, {
          toValue: 1.3,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(emojiScale, {
          toValue: 1.0,
          duration: 500,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    emojiLoop.start();

    // 성공 햅틱
    void (async () => {
      try {
        await generateHapticFeedback({ type: 'success' });
      } catch {
        // 햅틱 실패는 조용히 처리
      }
    })();

    // 사용량 체크 및 증가
    void (async () => {
      try {
        const usage = await loadUsageData();
        const nextCount = usage.usedCount + 1;
        const maxAllowed = DAILY_LIMIT + usage.bonusCount;

        const updated: UsageData = { ...usage, usedCount: nextCount };
        await saveUsageData(updated);

        if (nextCount > maxAllowed) {
          setIsLimitReached(true);
        }
      } catch {
        // 사용량 체크 실패 시 제한 없이 진행
      }
    })();

    return () => {
      emojiLoop.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── 보상형 광고 ──────────────────────────────────────────────────────────

  const handleWatchAd = useCallback(async (): Promise<void> => {
    if (isAdLoading) return;
    setIsAdLoading(true);

    try {
      // 1. 광고 로드
      await new Promise<void>((resolve, reject) => {
        const cleanup = GoogleAdMob.loadAppsInTossAdMob({
          options: { adGroupId: AD_GROUP_ID },
          onEvent: (event) => {
            if (event.type === 'loaded') {
              cleanup();
              resolve();
            }
          },
          onError: (err) => {
            cleanup();
            reject(err);
          },
        });
      });

      // 2. 광고 표시 + 보상 대기
      await new Promise<void>((resolve, reject) => {
        let earned = false;
        const cleanup = GoogleAdMob.showAppsInTossAdMob({
          options: { adGroupId: AD_GROUP_ID },
          onEvent: (event: ShowAdMobEvent) => {
            if (event.type === 'userEarnedReward') {
              earned = true;
            }
            if (event.type === 'dismissed' || event.type === 'failedToShow') {
              cleanup();
              if (earned) {
                resolve();
              } else {
                reject(new Error('광고를 끝까지 시청해야 해요.'));
              }
            }
          },
          onError: (err) => {
            cleanup();
            reject(err);
          },
        });
      });

      // 3. 보너스 적립
      const usage = await loadUsageData();
      const updated: UsageData = { ...usage, bonusCount: usage.bonusCount + BONUS_PER_AD };
      await saveUsageData(updated);
      setIsLimitReached(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : '광고 재생에 실패했어요.';
      Alert.alert('알림', message);
    } finally {
      setIsAdLoading(false);
    }
  }, [isAdLoading]);

  // ─── 결과 공유 ────────────────────────────────────────────────────────────

  const handleShare = useCallback(async (): Promise<void> => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      // Toss 공유 링크 생성
      await getTossShareLink(`/roly-app/result?item=${encodeURIComponent(result)}`);

      // 친구 초대 공유
      contactsViral({
        options: { moduleId: VIRAL_MODULE_ID },
        onEvent: (_event) => {
          // 공유 이벤트 처리 (필요 시 리워드 지급 로직 추가)
        },
        onError: (_err) => {
          Alert.alert('알림', '공유하는 중 오류가 발생했어요.');
        },
      });
    } catch {
      Alert.alert('알림', '공유 링크를 생성하는 중 오류가 발생했어요.');
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, result]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <NavigationBar title="결과!" onBack={onBack} />

      <View style={styles.body}>
        {/* 🎉 이모지 */}
        <Animated.Text style={[styles.emojiDecor, { transform: [{ scale: emojiScale }] }]}>
          🎉
        </Animated.Text>

        {/* 결과 카드 */}
        <Animated.View
          style={[
            styles.resultCard,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          <Text style={styles.resultIcon}>{isNumber ? '🎲' : '🎯'}</Text>
          <Text style={styles.resultLabel}>{isNumber ? '당첨 번호' : '선택된 항목'}</Text>
          <Text style={styles.resultText} numberOfLines={2} adjustsFontSizeToFit>
            {result}
          </Text>
        </Animated.View>

        <Text style={styles.subText}>
          {spinParams.label} 중 {spinParams.items.length}개에서 뽑았어요
        </Text>

        {/* 사용량 초과 배너 */}
        {isLimitReached && (
          <View style={styles.limitBanner}>
            <Text style={styles.limitBannerText}>
              오늘 {DAILY_LIMIT}회를 모두 사용했어요
            </Text>
            <Text style={styles.limitBannerSub}>
              광고를 보면 {BONUS_PER_AD}회를 더 사용할 수 있어요
            </Text>
          </View>
        )}
      </View>

      {/* 하단 버튼 영역 */}
      <View style={styles.buttonArea}>
        {isLimitReached ? (
          /* 광고 보고 계속하기 */
          <TouchableOpacity
            style={[styles.adButton, isAdLoading && styles.buttonDisabled]}
            onPress={handleWatchAd}
            disabled={isAdLoading}
          >
            <Text style={styles.adButtonText}>
              {isAdLoading ? '광고 불러오는 중...' : '📺 광고 보고 계속하기'}
            </Text>
          </TouchableOpacity>
        ) : (
          /* 일반 버튼 */
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>🔄 다시 돌리기</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.shareButton, isSharing && styles.buttonDisabled]}
          onPress={handleShare}
          disabled={isSharing}
        >
          <Text style={styles.shareButtonText}>
            {isSharing ? '공유 중...' : '🔗 결과 공유하기'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeButton} onPress={onHome}>
          <Text style={styles.homeButtonText}>처음으로</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.grey50 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },

  emojiDecor: { fontSize: 48, marginBottom: 8 },

  resultCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.grey100,
    elevation: 4,
    shadowColor: colors.grey900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    gap: 10,
  },
  resultIcon: { fontSize: 48 },
  resultLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.grey500,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resultText: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.grey900,
    textAlign: 'center',
    lineHeight: 48,
    minWidth: '80%',
  },

  subText: { marginTop: 16, fontSize: 14, color: colors.grey500, textAlign: 'center' },

  limitBanner: {
    marginTop: 16,
    backgroundColor: colors.orange50,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.orange200,
    gap: 4,
  },
  limitBannerText: { fontSize: 14, fontWeight: '700', color: colors.orange600 },
  limitBannerSub: { fontSize: 12, color: colors.orange500 },

  buttonArea: { padding: 16, paddingBottom: 36, gap: 10 },

  retryButton: {
    height: 56,
    backgroundColor: colors.blue500,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: { color: colors.white, fontSize: 17, fontWeight: '700' },

  adButton: {
    height: 56,
    backgroundColor: colors.orange500,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adButtonText: { color: colors.white, fontSize: 16, fontWeight: '700' },

  shareButton: {
    height: 52,
    backgroundColor: colors.white,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.grey200,
  },
  shareButtonText: { color: colors.grey700, fontSize: 15, fontWeight: '600' },

  homeButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonText: { color: colors.grey500, fontSize: 15, fontWeight: '500' },

  buttonDisabled: { opacity: 0.5 },
});
