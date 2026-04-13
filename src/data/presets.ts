export interface Preset {
  id: string;
  label: string;
  items: string[];
}

export const PRESETS: Preset[] = [
  {
    id: 'food',
    label: '🍽️ 오늘 뭐 먹지?',
    items: ['치킨', '피자', '삼겹살', '라면', '순대국', '파스타', '초밥', '햄버거'],
  },
  {
    id: 'person',
    label: '👤 누가 할래?',
    items: [],
  },
  {
    id: 'penalty',
    label: '🎲 벌칙 뽑기',
    items: ['노래 한 곡', '춤 추기', '먼저 계산', '음료 사기', '청소하기'],
  },
  {
    id: 'team',
    label: '⚔️ 팀 나누기',
    items: [],
  },
];
