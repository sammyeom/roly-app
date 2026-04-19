import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors } from '@toss/tds-react-native';
import { InlineAd } from '@apps-in-toss/framework';
import { useNavigation } from '@granite-js/native/@react-navigation/native';
import type { NativeStackNavigationProp } from '@granite-js/native/@react-navigation/native-stack';
import { PRESETS } from '../data/presets';
import type { RootParamList, SpinParams } from '../types/navigation';

// 토스 콘솔에서 발급받은 배너 광고 그룹 ID로 교체하세요
const BANNER_AD_GROUP_ID = 'ait.v2.live.e278ba2db60f41ce';

// ─── Props ──────────────────────────────────────────────────────────────────

type Tab = 'roulette' | 'number';

// ─── HomeScreen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const [activeTab, setActiveTab] = useState<Tab>('roulette');
  const [inputText, setInputText] = useState<string>('');
  const [items, setItems] = useState<string[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [minText, setMinText] = useState<string>('1');
  const [maxText, setMaxText] = useState<string>('45');
  const [countText, setCountText] = useState<string>('6');

  function pushSpin(params: SpinParams): void {
    navigation.navigate('/spin', params);
  }

  function handleAddItem(): void {
    const trimmed = inputText.trim();
    if (trimmed.length === 0) return;
    if (items.includes(trimmed)) {
      Alert.alert('알림', '이미 추가된 항목이에요.');
      return;
    }
    setItems([...items, trimmed]);
    setInputText('');
    setSelectedPresetId(null);
  }

  function handleRemoveItem(index: number): void {
    setItems(items.filter((_, i) => i !== index));
    setSelectedPresetId(null);
  }

  function handleSelectPreset(presetId: string, presetItems: string[]): void {
    if (presetItems.length === 0) {
      setItems([]);
      setSelectedPresetId(presetId);
      Alert.alert('안내', '이름을 직접 추가해주세요.');
      return;
    }
    setItems(presetItems);
    setSelectedPresetId(presetId);
  }

  function handleStartRoulette(): void {
    try {
      if (items.length < 2) {
        Alert.alert('알림', '항목을 2개 이상 추가해주세요.');
        return;
      }
      pushSpin({ mode: 'roulette', items, label: '뭐 뽑을까?' });
    } catch {
      Alert.alert('오류', '시작할 수 없어요. 다시 시도해주세요.');
    }
  }

  function handleStartNumber(): void {
    try {
      const min = parseInt(minText, 10);
      const max = parseInt(maxText, 10);
      const count = parseInt(countText, 10);

      if (isNaN(min) || isNaN(max) || isNaN(count)) {
        Alert.alert('알림', '숫자를 올바르게 입력해주세요.');
        return;
      }
      if (min >= max) {
        Alert.alert('알림', '최솟값은 최댓값보다 작아야 해요.');
        return;
      }
      if (max - min > 999) {
        Alert.alert('알림', '범위는 1000 이하로 설정해주세요.');
        return;
      }
      if (count < 1 || count > max - min + 1) {
        Alert.alert('알림', `개수는 1 이상 ${max - min + 1} 이하로 설정해주세요.`);
        return;
      }

      const rangeItems = Array.from({ length: max - min + 1 }, (_, i) => String(min + i));
      pushSpin({ mode: 'number', items: rangeItems, label: '번호 추첨', count });
    } catch {
      Alert.alert('오류', '추첨할 수 없어요. 다시 시도해주세요.');
    }
  }

  return (
    <View style={styles.container}>
      {/* 탭 바 */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'roulette' && styles.tabActive]}
          onPress={() => setActiveTab('roulette')}
        >
          <Text style={[styles.tabText, activeTab === 'roulette' && styles.tabTextActive]}>
            뭐 뽑을까?
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'number' && styles.tabActive]}
          onPress={() => setActiveTab('number')}
        >
          <Text style={[styles.tabText, activeTab === 'number' && styles.tabTextActive]}>
            번호 추첨
          </Text>
        </TouchableOpacity>
      </View>

      {/* 배너 광고 */}
      <View style={styles.bannerAdContainer}>
        <InlineAd adUnitId={BANNER_AD_GROUP_ID} variant="card" />
      </View>

      {activeTab === 'roulette' ? (
        <RouletteTab
          inputText={inputText}
          items={items}
          selectedPresetId={selectedPresetId}
          onChangeInput={setInputText}
          onAddItem={handleAddItem}
          onRemoveItem={handleRemoveItem}
          onSelectPreset={handleSelectPreset}
          onStart={handleStartRoulette}
        />
      ) : (
        <NumberTab
          minText={minText}
          maxText={maxText}
          countText={countText}
          onChangeMin={setMinText}
          onChangeMax={setMaxText}
          onChangeCount={setCountText}
          onStart={handleStartNumber}
        />
      )}
    </View>
  );
}

// ─── 뭐 뽑을까? 탭 ──────────────────────────────────────────────────────────

interface RouletteTabProps {
  inputText: string;
  items: string[];
  selectedPresetId: string | null;
  onChangeInput: (text: string) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onSelectPreset: (id: string, items: string[]) => void;
  onStart: () => void;
}

function RouletteTab({
  inputText, items, selectedPresetId, onChangeInput, onAddItem, onRemoveItem, onSelectPreset, onStart,
}: RouletteTabProps) {
  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 프리셋 */}
        <Text style={styles.sectionLabel}>프리셋으로 빠르게</Text>
        <View style={styles.presetGrid}>
          {PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <TouchableOpacity
                key={preset.id}
                style={[styles.presetCard, isSelected && styles.presetCardSelected]}
                onPress={() => onSelectPreset(preset.id, preset.items)}
                activeOpacity={0.8}
              >
                <Text style={[styles.presetLabel, isSelected && styles.presetLabelSelected]}>
                  {preset.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 항목 추가 */}
        <Text style={styles.sectionLabel}>항목 추가</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={onChangeInput}
            placeholder="항목 이름 입력"
            placeholderTextColor={colors.grey400}
            onSubmitEditing={onAddItem}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addButton} onPress={onAddItem}>
            <Text style={styles.addButtonText}>추가</Text>
          </TouchableOpacity>
        </View>

        {/* 추가된 항목 목록 */}
        {items.length > 0 && (
          <View style={styles.itemList}>
            {items.map((item, index) => (
              <View key={index} style={styles.itemChip}>
                <Text style={styles.itemChipText}>{item}</Text>
                <TouchableOpacity
                  onPress={() => onRemoveItem(index)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.removeIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {items.length === 0 && (
          <Text style={styles.emptyHint}>항목을 2개 이상 추가하면 룰렛을 돌릴 수 있어요</Text>
        )}
      </ScrollView>

      {/* BottomCTA */}
      <View style={styles.bottomCTA}>
        <TouchableOpacity
          style={[styles.ctaButton, items.length < 2 && styles.ctaButtonDisabled]}
          onPress={onStart}
          disabled={items.length < 2}
        >
          <Text style={styles.ctaButtonText}>돌리기!</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── 번호 추첨 탭 ────────────────────────────────────────────────────────────

interface NumberTabProps {
  minText: string;
  maxText: string;
  countText: string;
  onChangeMin: (text: string) => void;
  onChangeMax: (text: string) => void;
  onChangeCount: (text: string) => void;
  onStart: () => void;
}

function NumberTab({ minText, maxText, countText, onChangeMin, onChangeMax, onChangeCount, onStart }: NumberTabProps) {
  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 미리보기 */}
        <View style={styles.numberPreview}>
          <Text style={styles.numberPreviewText}>{minText} ~ {maxText}</Text>
          <Text style={styles.numberPreviewSub}>이 범위에서 {countText}개를 뽑아요</Text>
        </View>

        {/* 최솟값 / 최댓값 */}
        <Text style={styles.sectionLabel}>범위 설정</Text>
        <View style={styles.rangeRow}>
          <View style={styles.rangeItem}>
            <Text style={styles.rangeLabel}>최솟값</Text>
            <TextInput
              style={styles.rangeInput}
              value={minText}
              onChangeText={onChangeMin}
              keyboardType="number-pad"
              maxLength={5}
              placeholderTextColor={colors.grey400}
            />
          </View>
          <Text style={styles.rangeSep}>~</Text>
          <View style={styles.rangeItem}>
            <Text style={styles.rangeLabel}>최댓값</Text>
            <TextInput
              style={styles.rangeInput}
              value={maxText}
              onChangeText={onChangeMax}
              keyboardType="number-pad"
              maxLength={5}
              placeholderTextColor={colors.grey400}
            />
          </View>
        </View>

        {/* 개수 */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>추첨 개수</Text>
        <View style={styles.countRow}>
          <TextInput
            style={styles.countInput}
            value={countText}
            onChangeText={onChangeCount}
            keyboardType="number-pad"
            maxLength={3}
            placeholderTextColor={colors.grey400}
          />
          <Text style={styles.countUnit}>개</Text>
        </View>
      </ScrollView>

      {/* BottomCTA */}
      <View style={styles.bottomCTA}>
        <TouchableOpacity style={styles.ctaButton} onPress={onStart}>
          <Text style={styles.ctaButtonText}>추첨하기!</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.grey50 },
  flex: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.blue500 },
  tabText: { fontSize: 15, fontWeight: '500', color: colors.grey500 },
  tabTextActive: { color: colors.blue500, fontWeight: '700' },
  bannerAdContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 16 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.grey500,
    marginBottom: 10,
    marginTop: 20,
    letterSpacing: 0.3,
  },
  // 프리셋
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  presetCard: {
    width: '47%',
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.grey100,
    justifyContent: 'center',
  },
  presetCardSelected: {
    borderColor: colors.blue500,
    borderWidth: 2,
    backgroundColor: colors.blue50,
  },
  presetLabel: { fontSize: 14, color: colors.grey800, fontWeight: '600' },
  presetLabelSelected: { color: colors.blue600 },
  // 입력 행
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: colors.grey200,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: colors.white,
    color: colors.grey900,
  },
  addButton: {
    height: 48,
    paddingHorizontal: 20,
    backgroundColor: colors.blue500,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  // 항목 칩
  itemList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blue50,
    borderRadius: 20,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 10,
    gap: 6,
  },
  itemChipText: { fontSize: 14, color: colors.blue600, fontWeight: '500' },
  removeIcon: { fontSize: 12, color: colors.blue400 },
  emptyHint: {
    marginTop: 16,
    fontSize: 13,
    color: colors.grey400,
    textAlign: 'center',
    lineHeight: 20,
  },
  // 번호 추첨
  numberPreview: {
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.grey100,
  },
  numberPreviewText: { fontSize: 34, fontWeight: '700', color: colors.grey900, marginBottom: 6 },
  numberPreviewSub: { fontSize: 14, color: colors.grey500 },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rangeItem: { flex: 1 },
  rangeLabel: { fontSize: 13, color: colors.grey600, fontWeight: '500', marginBottom: 6 },
  rangeInput: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.grey200,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: '600',
    backgroundColor: colors.white,
    color: colors.grey900,
    textAlign: 'center',
  },
  rangeSep: { fontSize: 20, color: colors.grey400, marginTop: 22, fontWeight: '300' },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countInput: {
    width: 100,
    height: 52,
    borderWidth: 1,
    borderColor: colors.grey200,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: '600',
    backgroundColor: colors.white,
    color: colors.grey900,
    textAlign: 'center',
  },
  countUnit: { fontSize: 18, color: colors.grey700, fontWeight: '500' },
  // BottomCTA
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
  ctaButtonDisabled: { backgroundColor: colors.grey200 },
  ctaButtonText: { color: colors.white, fontSize: 18, fontWeight: '700' },
});
