import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { colors } from '@toss/tds-react-native';
import NavigationBar from '../components/NavigationBar';
import { type SpinParams, type ResultParams } from '../App';
import { calcSpinDegree, getSelectedIndex } from '../utils/random';

interface SpinScreenProps {
  params: SpinParams;
  onNavigateResult: (params: ResultParams) => void;
  onBack: () => void;
}

const SLICE_COLORS = [
  colors.blue500,
  colors.blue600,
  colors.green500,
  colors.orange400,
  colors.red500,
  colors.grey600,
  colors.grey700,
  colors.grey800,
];

export default function SpinScreen({ params, onNavigateResult, onBack }: SpinScreenProps) {
  const { items, label } = params;
  const { width } = useWindowDimensions();
  const wheelSize = Math.min(width - 48, 320);

  const spinValue = useRef(new Animated.Value(0)).current;
  const currentDegree = useRef(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'done'>('idle');

  const handleSpin = useCallback(() => {
    if (isSpinning) return;
    setIsSpinning(true);
    setPhase('spinning');

    const extraDegree = calcSpinDegree(items.length);
    const targetDegree = currentDegree.current + extraDegree;
    currentDegree.current = targetDegree;

    Animated.timing(spinValue, {
      toValue: targetDegree,
      duration: 4000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsSpinning(false);
      setPhase('done');

      const selectedIndex = getSelectedIndex(targetDegree % 360, items.length);
      const result = items[selectedIndex] ?? items[0] ?? '';

      setTimeout(() => {
        onNavigateResult({ result, spinParams: params });
      }, 600);
    });
  }, [isSpinning, items, spinValue, params, onNavigateResult]);

  const rotateInterpolation = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });

  const sliceDeg = 360 / items.length;

  return (
    <View style={styles.container}>
      <NavigationBar title={label} onBack={onBack} />

      <View style={styles.body}>
        <View style={styles.pointerWrapper}>
          <View style={styles.pointer} />
        </View>

        <Animated.View
          style={[
            styles.wheel,
            { width: wheelSize, height: wheelSize, borderRadius: wheelSize / 2 },
            { transform: [{ rotate: rotateInterpolation }] },
          ]}
        >
          {items.map((item, index) => (
            <WheelSlice
              key={index}
              index={index}
              total={items.length}
              label={item}
              sliceDeg={sliceDeg}
              wheelSize={wheelSize}
              bgColor={SLICE_COLORS[index % SLICE_COLORS.length] ?? colors.blue500}
            />
          ))}
        </Animated.View>

        <TouchableOpacity
          style={[styles.centerButton, isSpinning && styles.centerButtonSpinning]}
          onPress={handleSpin}
          disabled={isSpinning}
          activeOpacity={0.85}
        >
          <Text style={styles.centerButtonText}>
            {phase === 'idle' ? 'SPIN' : phase === 'spinning' ? '...' : '완료!'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.itemsRow}>
        {items.slice(0, 8).map((item, index) => (
          <View key={index} style={[styles.dot, { backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length] ?? colors.grey500 }]}>
            <Text style={styles.dotText}>{item.length > 4 ? item.slice(0, 4) + '…' : item}</Text>
          </View>
        ))}
        {items.length > 8 && (
          <View style={styles.moreChip}>
            <Text style={styles.moreText}>+{items.length - 8}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

interface WheelSliceProps {
  index: number;
  total: number;
  label: string;
  sliceDeg: number;
  wheelSize: number;
  bgColor: string;
}

function WheelSlice({ index, sliceDeg, wheelSize, label, bgColor }: WheelSliceProps) {
  const radius = wheelSize / 2;
  const rotationDeg = index * sliceDeg + sliceDeg / 2;

  return (
    <View
      style={[
        styles.sliceContainer,
        {
          width: wheelSize,
          height: wheelSize,
          borderRadius: radius,
          transform: [{ rotate: `${index * sliceDeg}deg` }],
        },
      ]}
    >
      <View
        style={[
          styles.slicePie,
          {
            borderWidth: radius,
            borderTopColor: bgColor,
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
            borderLeftColor: sliceDeg > 180 ? bgColor : 'transparent',
          },
        ]}
      />
      <Text
        style={[
          styles.sliceLabel,
          {
            transform: [
              { rotate: `${rotationDeg}deg` },
              { translateX: radius * 0.55 },
              { rotate: '-90deg' },
            ],
          },
        ]}
        numberOfLines={1}
      >
        {label.length > 6 ? label.slice(0, 6) + '…' : label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.grey50 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pointerWrapper: {
    position: 'absolute',
    top: '10%',
    zIndex: 10,
    alignItems: 'center',
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 24,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.red500,
  },
  wheel: {
    overflow: 'hidden',
    elevation: 6,
    shadowColor: colors.grey900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  sliceContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  slicePie: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  },
  sliceLabel: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  centerButton: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.grey900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderWidth: 3,
    borderColor: colors.grey100,
  },
  centerButtonSpinning: { backgroundColor: colors.grey50 },
  centerButtonText: { fontSize: 15, fontWeight: '800', color: colors.blue500, letterSpacing: 0.5 },
  itemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 16,
    gap: 6,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.grey100,
    paddingBottom: 32,
  },
  dot: { borderRadius: 16, paddingVertical: 5, paddingHorizontal: 10 },
  dotText: { fontSize: 12, fontWeight: '600', color: colors.white },
  moreChip: { borderRadius: 16, paddingVertical: 5, paddingHorizontal: 10, backgroundColor: colors.grey200 },
  moreText: { fontSize: 12, fontWeight: '600', color: colors.grey600 },
});
