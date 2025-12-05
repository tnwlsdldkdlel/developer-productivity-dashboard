import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 코드 분할 최적화
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React 관련 라이브러리를 별도 청크로 분리
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }
            if (id.includes('react-grid-layout')) {
              return 'grid-layout'
            }
            if (id.includes('zustand')) {
              return 'state-management'
            }
            // 기타 node_modules는 vendor 청크로
            return 'vendor'
          }
          // 초기 화면 위젯은 메인 번들에 포함 (즉시 로드)
          if (id.includes('/widgets/GitHubWidget') || id.includes('/widgets/TodoWidget')) {
            return undefined // 메인 번들에 포함
          }
        },
      },
    },
    // CSS 코드 분할 활성화
    cssCodeSplit: true,
    // 청크 크기 경고 임계값 설정
    chunkSizeWarningLimit: 1000,
  },
})

