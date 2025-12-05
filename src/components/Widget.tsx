/**
 * Widget 컴포넌트
 * 모든 위젯의 공통 래퍼 컴포넌트
 * - 헤더 영역 (제목, 설정 아이콘)
 * - 일관된 스타일링
 * - 접근성 고려 (ARIA 레이블, 키보드 네비게이션)
 */

import { ReactNode } from 'react'
import { Settings } from 'lucide-react'

interface WidgetProps {
  title: string
  children: ReactNode
  onSettingsClick?: () => void
  className?: string
}

const Widget = ({ title, children, onSettingsClick, className = '' }: WidgetProps) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 h-full flex flex-col ${className}`}
      role="region"
      aria-label={title}
      tabIndex={0}
    >
      <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-2 widget-drag-handle cursor-move">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white" id={`widget-title-${title}`}>
          {title}
        </h2>
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`${title} 설정`}
            aria-describedby={`widget-title-${title}`}
          >
            <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto" aria-labelledby={`widget-title-${title}`}>
        {children}
      </div>
    </div>
  )
}

export default Widget

