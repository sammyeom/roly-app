const MAX_FREE_SPINS = 3;

let spinCount = 0;
let lastResetDate = new Date().toDateString();

function resetIfNewDay(): void {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    spinCount = 0;
    lastResetDate = today;
  }
}

export function getRemainingSpins(): number {
  resetIfNewDay();
  return Math.max(0, MAX_FREE_SPINS - spinCount);
}

export function useSpin(): boolean {
  resetIfNewDay();
  if (spinCount < MAX_FREE_SPINS) {
    spinCount++;
    return true;
  }
  return false;
}

export function addBonusSpin(): void {
  resetIfNewDay();
  if (spinCount > 0) {
    spinCount--;
  }
}
