import { appsInToss } from '@apps-in-toss/framework/plugins';
import { defineConfig } from '@granite-js/react-native/config';
import { router } from '@granite-js/plugin-router';

export default defineConfig({
  scheme: 'intoss',
  appName: 'roly-spinner',
  plugins: [
    router(),
    appsInToss({
      brand: {
        displayName: '롤리',
        primaryColor: '#3182F6',
        icon: 'https://static.toss.im/appsintoss/33673/e578291e-76d8-4c74-9db6-8184fde85717.png',
      },
      permissions: [],
    }),
  ],
});
