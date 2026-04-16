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
  generateHapticFeedback,
  getTossShareLink,
  share,
} from '@apps-in-toss/framework';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@granite-js/native/@react-navigation/native';
import type { NativeStackNavigationProp } from '@granite-js/native/@react-navigation/native-stack';
import type { RootParamList } from '../types/navigation';

// ─── ResultScreen ─────────────────────────────────────────────────────────────

export default function ResultScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const route = useRoute<RouteProp<RootParamList, '/result'>>();
  const { result, spinParams } = route.params;
  const isNumber = spinParams.mode === 'number';

  // 등장 애니메이션
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // 🎉 이모지 반복 애니메이션
  const emojiScale = useRef(new Animated.Value(1)).current;

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

    return () => {
      emojiLoop.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── 결과 공유 ────────────────────────────────────────────────────────────

  const handleShare = useCallback(async (): Promise<void> => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      const shareLink = await getTossShareLink('intoss://roly-spinner');
      await share({ message: shareLink });
    } catch {
      Alert.alert('알림', '공유하는 중 오류가 발생했어요.');
    } finally {
      setIsSharing(false);
    }
  }, [isSharing]);

  // ─── 다시 돌리기 / 처음으로 ─────────────────────────────────────────────

  const handleRetry = useCallback((): void => {
    // result 화면을 spin으로 교체하여 동일 파라미터로 재시작.
    navigation.replace('/spin', spinParams);
  }, [navigation, spinParams]);

  const handleHome = useCallback((): void => {
    // 스택 최상단(home)으로 복귀.
    navigation.popToTop();
  }, [navigation]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
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
      </View>

      {/* 하단 버튼 영역 */}
      <View style={styles.buttonArea}>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>🔄 다시 돌리기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shareButton, isSharing && styles.buttonDisabled]}
          onPress={handleShare}
          disabled={isSharing}
        >
          <Text style={styles.shareButtonText}>
            {isSharing ? '공유 중...' : '🔗 결과 공유하기'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeButton} onPress={handleHome}>
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

  buttonArea: { padding: 16, paddingBottom: 36, gap: 10 },

  retryButton: {
    height: 56,
    backgroundColor: colors.blue500,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: { color: colors.white, fontSize: 17, fontWeight: '700' },

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
