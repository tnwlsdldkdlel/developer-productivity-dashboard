/**
 * Widget 컴포넌트
 * 모든 위젯의 공통 래퍼 컴포넌트
 * - 헤더 영역 (제목, 설정 아이콘)
 * - 일관된 스타일링
 * - 접근성 고려 (ARIA 레이블, 키보드 네비게이션)
 * - 성능 최적화: React.memo로 불필요한 리렌더링 방지
 */

import { ReactNode, memo } from 'react'
import { Settings } from 'lucide-react'

interface WidgetProps {
  title: string
  children: ReactNode
  onSettingsClick?: () => void
  className?: string
}

const Widget = memo(({ title, children, onSettingsClick, className = '' }: WidgetProps) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 h-full flex flex-col ${className}`}
      role="region"
      aria-label={title}
      tabIndex={0}
    >
      <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
        <h2 
          className="text-lg font-semibold text-gray-900 dark:text-white widget-drag-handle cursor-move flex-1" 
          id={`widget-title-${title}`}
        >
          {title}
        </h2>
        {onSettingsClick && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onSettingsClick()
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            onTouchStart={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
            aria-label={`${title} 설정`}
            aria-describedby={`widget-title-${title}`}
          >
            <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
})

Widget.displayName = 'Widget'

export default Widget

