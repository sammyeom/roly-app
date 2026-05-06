import { appsInToss } from '@apps-in-toss/framework/plugins';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  scheme: 'intoss',
  appName: 'roly-spinner',
  plugins: [
    appsInToss({
      brand: {
        displayName: '롤리', // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
        primaryColor: '#3182F6', // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
        icon: 'https://static.toss.im/appsintoss/33673/e578291e-76d8-4c74-9db6-8184fde85717.png',
      },
      permissions: [],
    }),
  ],
});
