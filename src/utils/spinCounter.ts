import { Storage } from '@apps-in-toss/framework';

const MAX_FREE_SPINS = 3;
const STORAGE_KEY = 'roly_spin_counter';

interface SpinData {
  count: number;
  date: string;
}

let cached: SpinData | null = null;
let loaded = false;

function todayString(): string {
  return new Date().toDateString();
}

function defaultData(): SpinData {
  return { count: 0, date: todayString() };
}

function resetIfNewDay(data: SpinData): SpinData {
  if (data.date !== todayString()) {
    return defaultData();
  }
  return data;
}

async function load(): Promise<SpinData> {
  if (loaded && cached != null) {
    return resetIfNewDay(cached);
  }

  try {
    const raw = await Storage.getItem(STORAGE_KEY);
    if (raw != null) {
      const parsed = JSON.parse(raw) as SpinData;
      cached = resetIfNewDay(parsed);
    } else {
      cached = defaultData();
    }
  } catch {
    cached = defaultData();
  }

  loaded = true;
  return cached;
}

async function save(data: SpinData): Promise<void> {
  cached = data;
  try {
    await Storage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // 저장 실패 시 메모리 캐시는 유지
  }
}

export async function getRemainingSpins(): Promise<number> {
  const data = await load();
  return Math.max(0, MAX_FREE_SPINS - data.count);
}

export async function useSpin(): Promise<boolean> {
  const data = await load();
  if (data.count < MAX_FREE_SPINS) {
    await save({ ...data, count: data.count + 1 });
    return true;
  }
  return false;
}

export async function addBonusSpin(): Promise<void> {
  const data = await load();
  if (data.count > 0) {
    await save({ ...data, count: data.count - 1 });
  }
}
