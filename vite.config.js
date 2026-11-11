import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [tailwindcss()],
  // 개발 전용: 백엔드 CORS 미설정으로 /api 요청을 Vite dev 서버가 대신 전달 (API_CHANGELOG.md 참고)
  server: {
    proxy: {
      '/api': {
        target: 'https://mind-test.store',
        changeOrigin: true,
        secure: true,
        // refresh 쿠키의 Domain 속성을 제거해 localhost 쿠키로 저장되게 함
        cookieDomainRewrite: { '*': '' },
      },
    },
  },
});
