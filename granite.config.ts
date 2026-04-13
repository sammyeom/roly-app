import { appsInToss } from '@apps-in-toss/framework/plugins';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  scheme: 'intoss',
  appName: 'roly-spinner',
  plugins: [
    appsInToss({
      brand: {
        displayName: 'Roly', // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
        primaryColor: '#3182F6', // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
        icon: 'https://static.toss.im/icons/png/4x/icon-roly.png', // 토스 콘솔에서 등록한 실제 아이콘 URL로 교체하세요.
      },
      permissions: [],
    }),
  ],
});
