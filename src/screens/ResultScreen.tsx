import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { colors } from '@toss/tds-react-native';
import { loadAppsInTossAdMob, showAppsInTossAdMob } from '@apps-in-toss/native-modules';
import NavigationBar from '../components/NavigationBar';
import { type ResultParams } from '../App';

// 광고 그룹 ID (토스 콘솔에서 발급받은 값으로 교체)
const AD_GROUP_ID = 'YOUR_AD_GROUP_ID';

interface ResultScreenProps {
  params: ResultParams;
  onRetry: () => void;
  onHome: () => void;
  onBack: () => void;
}

export default function ResultScreen({ params, onRetry, onHome, onBack }: ResultScreenProps) {
  const { result, spinParams } = params;

  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

    void loadAndShowAd();
  }, []);

  async function loadAndShowAd() {
    try {
      await new Promise<void>((resolve, reject) => {
        loadAppsInTossAdMob({
          options: { adGroupId: AD_GROUP_ID },
          onEvent: (event) => { if (event.type === 'loaded') resolve(); },
          onError: reject,
        });
      });
      await new Promise<void>((resolve, reject) => {
        showAppsInTossAdMob({
          options: { adGroupId: AD_GROUP_ID },
          onEvent: () => {},
          onError: reject,
        });
        resolve();
      });
    } catch {
      // 광고 로드/표시 실패는 조용히 처리
    }
  }

  const isNumber = spinParams.mode === 'number';

  return (
    <View style={styles.container}>
      <NavigationBar title="결과" onBack={onBack} />

      <View style={styles.body}>
        <Animated.View
          style={[
            styles.resultCard,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          <Text style={styles.resultEmoji}>{isNumber ? '🎲' : '🎯'}</Text>
          <Text style={styles.resultLabel}>{isNumber ? '당첨 번호' : '선택된 항목'}</Text>
          <Text style={styles.resultText} numberOfLines={2} adjustsFontSizeToFit>
            {result}
          </Text>
        </Animated.View>

        <Text style={styles.subText}>
          {spinParams.label} 중 {spinParams.items.length}개에서 뽑았어요
        </Text>
      </View>

      <View style={styles.buttonArea}>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>🔄 다시 뽑기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeButton} onPress={onHome}>
          <Text style={styles.homeButtonText}>처음으로</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.grey50 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  resultCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.grey100,
    elevation: 4,
    shadowColor: colors.grey900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    gap: 12,
  },
  resultEmoji: { fontSize: 56 },
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
  subText: { marginTop: 20, fontSize: 14, color: colors.grey500, textAlign: 'center' },
  buttonArea: { padding: 20, paddingBottom: 40, gap: 10 },
  retryButton: {
    height: 56,
    backgroundColor: colors.blue500,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: { color: colors.white, fontSize: 17, fontWeight: '700' },
  homeButton: {
    height: 52,
    backgroundColor: colors.white,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.grey200,
  },
  homeButtonText: { color: colors.grey700, fontSize: 16, fontWeight: '600' },
});
