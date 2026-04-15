import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  PixelRatio,
  type LayoutChangeEvent,
} from 'react-native';
import { colors } from '@toss/tds-react-native';
import { generateHapticFeedback } from '@apps-in-toss/framework';
import NavigationBar from '../components/NavigationBar';
import { type SpinParams, type ResultParams } from '../App';

// ─── Constants ───────────────────────────────────────────────────────────────

const ITEM_HEIGHT_FALLBACK = 72;  // 측정 전 컨테이너 임시 크기 (렌더 폴백용)
const VISIBLE_COUNT = 5;          // 홀수여야 가운데 항목이 정렬됨
const REPEAT_COUNT = 20;          // 슬롯 항목 반복 횟수

// ─── Props ───────────────────────────────────────────────────────────────────

interface SpinScreenProps {
  params: SpinParams;
  onNavigateResult: (params: ResultParams) => void;
  onBack: () => void;
}

// ─── SpinScreen ──────────────────────────────────────────────────────────────

export default function SpinScreen({ params, onNavigateResult, onBack }: SpinScreenProps) {
  const { items } = params;

  // 실제 렌더된 아이템 높이 실측 (정수로 라운딩해서 누적 오차 방지)
  const [itemHeight, setItemHeight] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'done'>('idle');

  const translateY = useRef(new Animated.Value(0)).current;

  // 슬롯 아이템 (items를 REPEAT_COUNT번 반복)
  const spinItems = useMemo<string[]>(() => {
    return Array.from({ length: REPEAT_COUNT }, () => items).flat();
  }, [items]);

  // items 변경 시 측정값 리셋
  useEffect(() => {
    setItemHeight(null);
    translateY.setValue(0);
  }, [items, translateY]);

  const handleFirstItemLayout = useCallback((e: LayoutChangeEvent) => {
    // RN 렌더 픽셀 그리드에 맞춰 라운딩 (Math.round보다 정확)
    const measured = PixelRatio.roundToNearestPixel(e.nativeEvent.layout.height);
    if (__DEV__) console.log('[SpinScreen] measured itemHeight:', measured);
    if (measured > 0) {
      setItemHeight((prev) => (prev === measured ? prev : measured));
    }
  }, []);

  const isReady = itemHeight != null && itemHeight > 0;

  const handleSpin = useCallback((): void => {
    if (isSpinning) return;
    if (itemHeight == null || itemHeight <= 0) return;

    const h = itemHeight;

    setIsSpinning(true);
    setPhase('spinning');

    // 당첨 인덱스 (items 기준)
    const winnerIdx = Math.floor(Math.random() * items.length);
    const winner = items[winnerIdx] ?? items[0] ?? '';

    // spinItems 기준 타깃 인덱스: 중반부 이후 반복에 위치시킴
    const targetRepeat = Math.floor(REPEAT_COUNT * 0.65);
    const targetIdx = targetRepeat * items.length + winnerIdx;

    // 가운데(center)에 타깃이 오도록 오프셋 계산 (측정된 정수 높이 사용)
    const centerOffset = Math.floor(VISIBLE_COUNT / 2);
    const targetY = -((targetIdx - centerOffset) * h);

    translateY.stopAnimation();
    translateY.setValue(0);

    // setValue(0)가 네이티브 스레드에 반영된 후 애니메이션 시작 (한 프레임 대기)
    requestAnimationFrame(() => {
      Animated.timing(translateY, {
        toValue: targetY,
        duration: 3000 + Math.random() * 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;

        void (async () => {
          try {
            await generateHapticFeedback({ type: 'success' });
          } catch {
            // 햅틱 실패는 조용히 처리
          }
        })();

        setIsSpinning(false);
        setPhase('done');

        setTimeout(() => {
          onNavigateResult({ result: winner, spinParams: params });
        }, 500);
      });
    });
  }, [isSpinning, itemHeight, items, translateY, params, onNavigateResult]);

  const h = itemHeight ?? ITEM_HEIGHT_FALLBACK;
  const containerHeight = h * VISIBLE_COUNT;
  const centerTop = Math.floor(VISIBLE_COUNT / 2) * h;
  const fadeHeight = h * 1.5;

  const ctaDisabled = isSpinning || phase === 'done' || !isReady;

  return (
    <View style={styles.container}>
      <NavigationBar title="Roly 🎲" onBack={onBack} />

      <View style={styles.body}>
        {/* 슬롯 윈도우 */}
        <View style={[styles.slotWrapper, { height: containerHeight }]}>
          {/* 선택 하이라이트 (측정 완료 후에만 표시) */}
          {isReady && (
            <View style={[styles.selectorHighlight, { top: centerTop, height: h }]} pointerEvents="none" />
          )}

          <View style={[styles.slotWindow, { height: containerHeight }]}>
            <Animated.View
              style={{
                transform: [{ translateY }],
                opacity: isReady ? 1 : 0,
              }}
            >
              {spinItems.map((item, index) => (
                <SlotItem
                  key={index}
                  label={item}
                  itemHeight={itemHeight}
                  onLayout={index === 0 ? handleFirstItemLayout : undefined}
                />
              ))}
            </Animated.View>
          </View>

          {/* 상단/하단 페이드 */}
          <View style={[styles.fadeEdge, styles.fadeTop, { height: fadeHeight }]} pointerEvents="none" />
          <View style={[styles.fadeEdge, styles.fadeBottom, { height: fadeHeight }]} pointerEvents="none" />
        </View>

        {/* 항목 목록 */}
        <View style={styles.chipsRow}>
          {items.slice(0, 6).map((item, index) => (
            <View key={index} style={styles.chip}>
              <Text style={styles.chipText} numberOfLines={1}>
                {item.length > 5 ? `${item.slice(0, 5)}…` : item}
              </Text>
            </View>
          ))}
          {items.length > 6 && (
            <View style={[styles.chip, styles.chipMore]}>
              <Text style={styles.chipText}>+{items.length - 6}</Text>
            </View>
          )}
        </View>
      </View>

      {/* BottomCTA */}
      <View style={styles.bottomCTA}>
        <TouchableOpacity
          style={[styles.ctaButton, ctaDisabled && styles.ctaButtonDisabled]}
          onPress={handleSpin}
          disabled={ctaDisabled}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>
            {!isReady ? '준비 중...' : phase === 'idle' ? 'SPIN!' : phase === 'spinning' ? '두근두근...' : '완료! 🎉'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── SlotItem ─────────────────────────────────────────────────────────────────

interface SlotItemProps {
  label: string;
  itemHeight: number | null;
  onLayout?: (e: LayoutChangeEvent) => void;
}

function SlotItem({ label, itemHeight, onLayout }: SlotItemProps) {
  // 측정 후엔 모든 아이템에 명시적 height 주입 → 실제 렌더 높이 == 계산 높이 보장
  return (
    <View
      style={[styles.slotItem, itemHeight != null ? { height: itemHeight } : null]}
      onLayout={onLayout}
    >
      <Text style={styles.slotItemText} numberOfLines={1} allowFontScaling={false}>
        {label}
      </Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.grey50 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },

  slotWrapper: {
    width: '100%',
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grey100,
    elevation: 4,
    shadowColor: colors.grey900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  selectorHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.blue50,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.blue400,
    zIndex: 2,
  },
  slotWindow: {
    overflow: 'hidden',
  },
  // height는 측정 후 SlotItem에 직접 주입 (StyleSheet엔 고정값 없음)
  slotItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    paddingHorizontal: 20,
  },
  slotItemText: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: colors.grey900,
    textAlign: 'center',
  },
  fadeEdge: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 3,
    pointerEvents: 'none',
  } as const,
  fadeTop: { top: 0, backgroundColor: colors.white },
  fadeBottom: { bottom: 0, backgroundColor: colors.white },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  chip: {
    backgroundColor: colors.blue50,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  chipMore: { backgroundColor: colors.grey100 },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.blue600 },

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
  ctaText: { fontSize: 20, fontWeight: '800', color: colors.white, letterSpacing: 1 },
});
