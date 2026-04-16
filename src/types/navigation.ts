export type SpinMode = 'roulette' | 'number';

export interface SpinParams {
  mode: SpinMode;
  items: string[];
  label: string;
  count?: number;
}

export interface ResultParams {
  result: string;
  spinParams: SpinParams;
}

export type RootParamList = {
  '/': undefined;
  '/spin': SpinParams;
  '/result': ResultParams;
};
