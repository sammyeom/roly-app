import { useCallback, useEffect, useState } from 'react';
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/framework';

// 토스 콘솔에서 발급받은 리워드 광고 그룹 ID로 교체하세요
const REWARD_AD_GROUP_ID = 'ait.v2.live.67400484de194f39';

type AdStatus = 'not_loaded' | 'loading' | 'loaded' | 'showing' | 'failed';

export function useRewardAd(onRewarded: () => void) {
  const [status, setStatus] = useState<AdStatus>('not_loaded');

  const load = useCallback(() => {
    if (!loadFullScreenAd.isSupported()) {
      setStatus('failed');
      return;
    }

    setStatus('loading');

    const cleanup = loadFullScreenAd({
      options: { adUnitId: REWARD_AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'loaded') {
          setStatus('loaded');
        }
      },
      onError: () => {
        setStatus('failed');
      },
    });

    return cleanup;
  }, []);

  useEffect(() => {
    return load();
  }, [load]);

  const show = useCallback(() => {
    if (!showFullScreenAd.isSupported()) return;

    setStatus('showing');

    showFullScreenAd({
      options: { adUnitId: REWARD_AD_GROUP_ID },
      onEvent: (event) => {
        switch (event.type) {
          case 'userEarnedReward':
            onRewarded();
            break;
          case 'dismissed':
            setStatus('not_loaded');
            load();
            break;
          case 'failedToShow':
            setStatus('failed');
            break;
        }
      },
      onError: () => {
        setStatus('failed');
      },
    });
  }, [onRewarded, load]);

  return { status, show, reload: load };
}
