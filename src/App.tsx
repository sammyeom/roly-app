import React, { useState } from 'react';
import HomeScreen from './screens/HomeScreen';
import SpinScreen from './screens/SpinScreen';
import ResultScreen from './screens/ResultScreen';

// ─── 네비게이션 타입 ────────────────────────────────────────────────────────

export type SpinMode = 'roulette' | 'number';

export interface SpinParams {
  mode: SpinMode;
  items: string[];       // 뽑기 항목 (number 모드면 ['1', '2', ..., 'N'])
  label: string;         // 화면 제목
}

export interface ResultParams {
  result: string;
  spinParams: SpinParams;
}

type Screen =
  | { name: 'home' }
  | { name: 'spin'; params: SpinParams }
  | { name: 'result'; params: ResultParams };

// ─── App ────────────────────────────────────────────────────────────────────

export default function AppNavigator() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  function goToSpin(params: SpinParams) {
    setScreen({ name: 'spin', params });
  }

  function goToResult(params: ResultParams) {
    setScreen({ name: 'result', params });
  }

  function goHome() {
    setScreen({ name: 'home' });
  }

  function goBack() {
    if (screen.name === 'result') {
      setScreen({ name: 'spin', params: screen.params.spinParams });
    } else {
      goHome();
    }
  }

  switch (screen.name) {
    case 'home':
      return <HomeScreen onNavigateSpin={goToSpin} />;
    case 'spin':
      return (
        <SpinScreen
          params={screen.params}
          onNavigateResult={goToResult}
          onBack={goHome}
        />
      );
    case 'result':
      return (
        <ResultScreen
          params={screen.params}
          onRetry={() => goToSpin(screen.params.spinParams)}
          onHome={goHome}
          onBack={goBack}
        />
      );
  }
}
