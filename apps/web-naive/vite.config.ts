import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            // 直连后端 matrix 服务（cemetery-app:8080），后端接口本身带 /api 前缀，不做 rewrite
            target: 'http://localhost:8080',
            ws: true,
          },
        },
      },
    },
  };
});
