import { useCallback, useState, useEffect } from 'react'
import { Responsive, WidthProvider, Layout } from 'react-grid-layout'
import toast from 'react-hot-toast'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import TodoWidget from './widgets/TodoWidget'
import GitHubWidget from './widgets/GitHubWidget'
import TechNewsWidget from './widgets/TechNewsWidget'
import StackOverflowWidget from './widgets/StackOverflowWidget'
import ErrorBoundary from './components/ErrorBoundary'
import { useDashboardStore } from './stores/dashboardStore'

const ResponsiveGridLayout = WidthProvider(Responsive)

function App() {
  const { layouts, updateLayout, resetLayouts } = useDashboardStore()
  const [currentBreakpoint, setCurrentBreakpoint] = useState<'lg' | 'md' | 'sm' | 'xs'>('lg')
  const [isInitialized, setIsInitialized] = useState(false)

  // 초기 마운트 시 레이아웃이 비어있거나 너무 작으면 기본 레이아웃으로 리셋
  useEffect(() => {
    if (!isInitialized) {
      const hasValidLayout = Object.values(layouts).some(
        (layout) => layout.length > 0 && layout.some((item) => item.h >= 6)
      )
      
      if (!hasValidLayout) {
        resetLayouts()
      }
      setIsInitialized(true)
    }
  }, [layouts, isInitialized, resetLayouts])

  // Breakpoint 변경 핸들러
  const handleBreakpointChange = useCallback(
    (newBreakpoint: string) => {
      const breakpoint = newBreakpoint as 'lg' | 'md' | 'sm' | 'xs'
      setCurrentBreakpoint(breakpoint)
    },
    []
  )

  // 레이아웃 변경 핸들러
  const handleLayoutChange = useCallback(
    (layout: Layout[]) => {
      updateLayout(currentBreakpoint, layout)
      toast.success('레이아웃이 저장되었습니다', { duration: 1500 })
    },
    [currentBreakpoint, updateLayout]
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 스킵 링크 (접근성) */}
      <a href="#main-content" className="skip-link">
        메인 콘텐츠로 건너뛰기
      </a>
      <div className="container mx-auto p-4 max-w-7xl">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            개발자 생산성 대시보드
          </h1>
        </header>
        <main id="main-content" role="main" aria-label="대시보드 메인 콘텐츠">

        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          cols={{ lg: 12, md: 12, sm: 12, xs: 12 }}
          rowHeight={90}
          onLayoutChange={handleLayoutChange}
          onBreakpointChange={handleBreakpointChange}
          isDraggable={true}
          isResizable={true}
          draggableHandle=".widget-drag-handle"
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
          resizeHandles={['se']}
          margin={[16, 16]}
          containerPadding={[0, 0]}
        >
          <div key="github" className="h-full">
            <ErrorBoundary widgetName="GitHub 활동">
              <GitHubWidget />
            </ErrorBoundary>
          </div>
          <div key="todo" className="h-full">
            <ErrorBoundary widgetName="오늘 할 일">
              <TodoWidget />
            </ErrorBoundary>
          </div>
          <div key="tech-news" className="h-full">
            <ErrorBoundary widgetName="기술 뉴스">
              <TechNewsWidget />
            </ErrorBoundary>
          </div>
          <div key="stackoverflow" className="h-full">
            <ErrorBoundary widgetName="Stack Overflow">
              <StackOverflowWidget />
            </ErrorBoundary>
          </div>
        </ResponsiveGridLayout>
        </main>
      </div>
    </div>
  )
}

export default App

