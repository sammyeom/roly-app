import { AppsInToss, getAnonymousKey, OverlayProvider } from '@apps-in-toss/framework';
import { PropsWithChildren, useEffect } from 'react';
import { InitialProps } from '@granite-js/react-native';
import { context } from '../require.context';

function AppContainer({ children }: PropsWithChildren<InitialProps>) {
  useEffect(() => {
    void getAnonymousKey().catch(() => {});
  }, []);

  return <OverlayProvider>{children}</OverlayProvider>;
}

export default AppsInToss.registerApp(AppContainer, { context });
