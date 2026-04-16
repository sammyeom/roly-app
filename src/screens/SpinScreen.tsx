import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { colors } from '@toss/tds-react-native';
import { generateHapticFeedback } from '@apps-in-toss/framework';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@granite-js/native/@react-navigation/native';
import type { NativeStackNavigationProp } from '@granite-js/native/@react-navigation/native-stack';
import { pickMultiple } from '../utils/random';
import type { RootParamList } from '../types/navigation';

// ─── Constants ───────────────────────────────────────────────────────────────

const ITEM_HEIGHT = 72;           // 고정 높이 (오차 방지를 위해 명시적 선언)
const VISIBLE_COUNT = 5;          // 홀수여야 가운데 항목이 명확함
const REPEAT_COUNT = 30;          // 충분한 회전을 위해 횟수 증가
const CENTER_INDEX = 2;           // 0, 1, [2], 3, 4 (5개 중 가운데)

// ─── SpinScreen ──────────────────────────────────────────────────────────────

export default function SpinScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const route = useRoute<RouteProp<RootParamList, '/spin'>>();
  const params = route.params;
  const { items, mode, count } = params;
  const drawCount = mode === 'number' ? Math.max(1, count ?? 1) : 1;

  const [isSpinning, setIsSpinning] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'done'>('idle');

  const translateY = useRef(new Animated.Value(0)).current;

  // 슬롯 아이템 생성
  const spinItems = useMemo<string[]>(() => {
    return Array.from({ length: REPEAT_COUNT }, () => items).flat();
  }, [items]);

  const handleSpin = useCallback((): void => {
    if (isSpinning) return;

    setIsSpinning(true);
    setPhase('spinning');

    // 1. 당첨 값 결정
    // number 모드에서 count > 1: 먼저 count개 뽑고, 슬롯은 첫 번째 값에 멈춤
    // 최종 result는 뽑은 숫자들을 오름차순으로 조인
    let winnerIdx: number;
    let finalResult: string;
    if (mode === 'number' && drawCount > 1) {
      const drawn = pickMultiple(items, drawCount);
      const sorted = [...drawn].sort((a, b) => Number(a) - Number(b));
      finalResult = sorted.join(', ');
      winnerIdx = items.indexOf(drawn[0] ?? items[0] ?? '');
      if (winnerIdx < 0) winnerIdx = 0;
    } else {
      winnerIdx = Math.floor(Math.random() * items.length);
      finalResult = items[winnerIdx] ?? items[0] ?? '';
    }

    // 2. 타겟 위치 계산
    // 뒤쪽 섹션(REPEAT_COUNT - 5 사이)에서 멈추도록 설정하여 충분히 돌게 함
    const targetSetIndex = REPEAT_COUNT - 5;
    const targetAbsoluteIdx = targetSetIndex * items.length + winnerIdx;

    // 핵심 공식: (타겟 인덱스 - 중앙 오프셋) * 높이
    // 위로 올라가야 하므로 마이너스(-) 값을 가집니다.
    const targetY = -(targetAbsoluteIdx - CENTER_INDEX) * ITEM_HEIGHT;

    translateY.stopAnimation();
    translateY.setValue(0);

    Animated.timing(translateY, {
      toValue: targetY,
      duration: 3500,
      easing: Easing.out(Easing.bezier(0.22, 1, 0.36, 1)), // 부드러운 감속 곡선
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;

      void generateHapticFeedback({ type: 'success' }).catch(() => {});

      setIsSpinning(false);
      setPhase('done');

      // 정확히 중앙에 멈춘 것을 확인 시키기 위해 약간의 지연 후 이동
      setTimeout(() => {
        navigation.navigate('/result', { result: finalResult, spinParams: params });
      }, 700);
    });
  }, [isSpinning, items, mode, drawCount, translateY, params, navigation]);

  const containerHeight = ITEM_HEIGHT * VISIBLE_COUNT;
  const highlightTop = CENTER_INDEX * ITEM_HEIGHT;

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <View style={[styles.slotWrapper, { height: containerHeight }]}>
          {/* 하이라이트 바: 정확히 중앙 칸에 고정 */}
          <View
            style={[styles.selectorHighlight, { top: highlightTop, height: ITEM_HEIGHT }]}
            pointerEvents="none"
          />

          <View style={[styles.slotWindow, { height: containerHeight }]}>
            <Animated.View style={{ transform: [{ translateY }] }}>
              {spinItems.map((item, index) => (
                <View key={index} style={styles.slotItem}>
                  <Text style={styles.slotItemText} allowFontScaling={false} numberOfLines={1}>
                    {item}
                  </Text>
                </View>
              ))}
            </Animated.View>
          </View>

          {/* 그라데이션 페이드 효과 */}
          <View style={[styles.fadeEdge, styles.fadeTop]} pointerEvents="none" />
          <View style={[styles.fadeEdge, styles.fadeBottom]} pointerEvents="none" />
        </View>

        {/* 하단 칩 리스트 */}
        <View style={styles.chipsRow}>
          {items.slice(0, 6).map((item, index) => (
            <View key={index} style={styles.chip}>
              <Text style={styles.chipText} numberOfLines={1} allowFontScaling={false}>
                {item.length > 5 ? `${item.slice(0, 5)}…` : item}
              </Text>
            </View>
          ))}
          {items.length > 6 && (
            <View style={[styles.chip, styles.chipMore]}>
              <Text style={styles.chipText} allowFontScaling={false}>+{items.length - 6}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.bottomCTA}>
        <TouchableOpacity
          style={[styles.ctaButton, (isSpinning || phase === 'done') && styles.ctaButtonDisabled]}
          onPress={handleSpin}
          disabled={isSpinning || phase === 'done'}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText} allowFontScaling={false}>
            {phase === 'idle' ? 'SPIN!' : phase === 'spinning' ? '회전 중...' : '결과 확인'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.grey50 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  slotWrapper: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.grey100,
  },
  slotWindow: { overflow: 'hidden' },
  selectorHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.blue400,
    zIndex: 10,
  },
  slotItem: {
    height: ITEM_HEIGHT, // 고정 높이 강제
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  slotItemText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.grey900,
  },
  fadeEdge: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 1.5,
    zIndex: 5,
  },
  fadeTop: { top: 0, backgroundColor: 'rgba(255,255,255,0.8)' },
  fadeBottom: { bottom: 0, backgroundColor: 'rgba(255,255,255,0.8)' },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  chip: {
    backgroundColor: colors.blue50,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipMore: { backgroundColor: colors.grey100 },
  chipText: { fontSize: 13, color: colors.blue600, fontWeight: '600' },
  bottomCTA: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.grey100,
  },
  ctaButton: {
    height: 56,
    backgroundColor: colors.blue500,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonDisabled: { backgroundColor: colors.grey300 },
  ctaText: { fontSize: 18, fontWeight: 'bold', color: colors.white },
});
