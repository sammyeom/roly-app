import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type LayoutChangeEvent,
} from 'react-native';
import { colors } from '@toss/tds-react-native';
import { generateHapticFeedback } from '@apps-in-toss/framework';
import NavigationBar from '../components/NavigationBar';
import { type SpinParams, type ResultParams } from '../App';

// ─── Constants ───────────────────────────────────────────────────────────────

const ITEM_HEIGHT_FALLBACK = 72;
const VISIBLE_COUNT = 5;       // 홀수여야 가운데 항목이 정렬됨
const REPEAT_COUNT = 20;       // 슬롯 항목 반복 횟수

// ─── Props ───────────────────────────────────────────────────────────────────

interface SpinScreenProps {
  params: SpinParams;
  onNavigateResult: (params: ResultParams) => void;
  onBack: () => void;
}

// ─── SpinScreen ──────────────────────────────────────────────────────────────

export default function SpinScreen({ params, onNavigateResult, onBack }: SpinScreenProps) {
  const { items } = params;

  // 실제 렌더된 아이템 높이를 측정해서 사용 (하드코딩된 72는 기기별로 오차 발생)
  const [itemHeight, setItemHeight] = useState<number | null>(null);
  const [offsetY, setOffsetY] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'done'>('idle');

  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // 슬롯 아이템 (items를 REPEAT_COUNT번 반복)
  const spinItems = useMemo<string[]>(() => {
    return Array.from({ length: REPEAT_COUNT }, () => items).flat();
  }, [items]);

  const handleFirstItemLayout = useCallback((e: LayoutChangeEvent) => {
    const measured = e.nativeEvent.layout.height;
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

    // 가운데(center)에 타깃이 오도록 오프셋 계산 (측정된 실제 높이 사용)
    const centerOffset = Math.floor(VISIBLE_COUNT / 2);
    const targetY = -((targetIdx - centerOffset) * h);

    const duration = 2000;
    let startTs: number | null = null;
    const startY = 0;
    setOffsetY(0);

    const tick = (ts: number) => {
      if (startTs == null) startTs = ts;
      const elapsed = ts - startTs;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const current = startY + (targetY - startY) * eased;
      setOffsetY(current);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // 최종 정확한 위치로 스냅
        setOffsetY(targetY);
        rafRef.current = null;

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
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [isSpinning, itemHeight, items, params, onNavigateResult]);

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
          {/* 선택 하이라이트 */}
          <View style={[styles.selectorHighlight, { top: centerTop, height: h }]} pointerEvents="none" />

          <View style={[styles.slotWindow, { height: containerHeight }]}>
            <View style={{ transform: [{ translateY: offsetY }] }}>
              {spinItems.map((item, index) => (
                <SlotItem
                  key={index}
                  label={item}
                  onLayout={index === 0 ? handleFirstItemLayout : undefined}
                />
              ))}
            </View>
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
  onLayout?: (e: LayoutChangeEvent) => void;
}

function SlotItem({ label, onLayout }: SlotItemProps) {
  return (
    <View style={styles.slotItem} onLayout={onLayout}>
      <Text style={styles.slotItemText} numberOfLines={1}>
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
  slotItem: {
    height: ITEM_HEIGHT_FALLBACK,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  slotItemText: {
    fontSize: 22,
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
