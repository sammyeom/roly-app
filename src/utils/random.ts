/**
 * 배열에서 랜덤 항목 하나를 선택합니다.
 */
export function pickRandom<T>(items: T[]): T {
  if (items.length === 0) {
    throw new Error('항목이 없습니다.');
  }
  const index = Math.floor(Math.random() * items.length);
  return items[index] as T;
}

/**
 * 배열에서 중복 없이 count개를 무작위로 선택합니다.
 */
export function pickMultiple(items: string[], count: number): string[] {
  if (count < 0 || count > items.length) {
    throw new Error(`개수는 0 이상 ${items.length} 이하여야 합니다.`);
  }
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * min ~ max 범위(포함)에서 랜덤 정수를 반환합니다.
 */
export function pickNumber(min: number, max: number): number {
  if (min > max) {
    throw new Error('최솟값이 최댓값보다 클 수 없습니다.');
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 이름 배열을 teamCount개 팀으로 랜덤하게 나눕니다.
 */
export function divideTeams(names: string[], teamCount: number): string[][] {
  if (teamCount < 1 || teamCount > names.length) {
    throw new Error(`팀 수는 1 이상 ${names.length} 이하여야 합니다.`);
  }
  const shuffled = [...names].sort(() => Math.random() - 0.5);
  const teams: string[][] = Array.from({ length: teamCount }, () => []);
  shuffled.forEach((name, i) => {
    teams[i % teamCount]!.push(name);
  });
  return teams;
}

/**
 * 룰렛 스핀 후 멈출 각도(degree)를 계산합니다.
 * 최소 5바퀴(1800도) + 랜덤 오프셋
 */
export function calcSpinDegree(itemCount: number): number {
  const minSpins = 5;
  const baseDegree = minSpins * 360;
  const sliceDegree = 360 / itemCount;
  const randomSlice = Math.floor(Math.random() * itemCount);
  const offset = randomSlice * sliceDegree + sliceDegree / 2;
  return baseDegree + offset;
}

/**
 * 최종 각도에서 선택된 항목 인덱스를 계산합니다.
 */
export function getSelectedIndex(finalDegree: number, itemCount: number): number {
  const normalizedDegree = finalDegree % 360;
  const sliceDegree = 360 / itemCount;
  const index = Math.floor((360 - normalizedDegree) / sliceDegree) % itemCount;
  return index;
}
