/**
 * Widget 컴포넌트
 * 모든 위젯의 공통 래퍼 컴포넌트
 * - 헤더 영역 (제목, 설정 아이콘)
 * - 일관된 스타일링
 * - 접근성 고려 (ARIA 레이블, 키보드 네비게이션)
 * - 성능 최적화: React.memo로 불필요한 리렌더링 방지
 * - 자동 대비 조절: 배경색에 따라 텍스트 색상 자동 조절
 */

import { ReactNode, memo, useMemo } from 'react'
import { Settings } from 'lucide-react'
import { getContrastColor } from '../utils/colorUtils'

interface WidgetProps {
  title: string
  children: ReactNode
  onSettingsClick?: () => void
  className?: string
  backgroundColor?: string
  subtitle?: string // 타이틀 옆에 표시할 부제목 (예: 업데이트 시간)
}

const Widget = memo(({ title, children, onSettingsClick, className = '', backgroundColor, subtitle }: WidgetProps) => {
  // 배경색에 따른 텍스트 색상 자동 결정
  const textColor = useMemo(() => {
    if (!backgroundColor) return undefined
    return getContrastColor(backgroundColor)
  }, [backgroundColor])

  // CSS 변수를 사용하여 모든 하위 요소에 색상 전파
  const widgetStyle = useMemo(() => {
    const style: React.CSSProperties & { '--widget-text-color'?: string } = {}
    
    if (backgroundColor) {
      style.backgroundColor = backgroundColor
    }
    
    if (textColor) {
      // CSS 변수로 설정하여 모든 하위 요소에서 사용 가능
      style['--widget-text-color'] = textColor
      style.color = textColor
    }

    return style
  }, [backgroundColor, textColor])

  const textColorStyle = textColor
    ? { color: textColor }
    : {}

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 h-full flex flex-col widget-auto-contrast ${className}`}
      style={widgetStyle}
      role="region"
      aria-label={title}
      tabIndex={0}
    >
      <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
        <div className="flex-1 widget-drag-handle cursor-move">
          <h2 
            className={`text-lg font-semibold ${textColor ? '' : 'text-gray-900 dark:text-white'}`}
            style={textColor ? textColorStyle : undefined}
            id={`widget-title-${title}`}
          >
            {title}
            {subtitle && (
              <span 
                className={`ml-2 text-xs font-normal ${textColor ? '' : 'text-gray-500 dark:text-gray-400'}`}
                style={textColor ? { ...textColorStyle, opacity: 0.8 } : undefined}
              >
                {subtitle}
              </span>
            )}
          </h2>
        </div>
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
      <div 
        className="flex-1 overflow-auto widget-content"
        style={textColor ? { color: textColor } : undefined}
      >
        {children}
      </div>
    </div>
  )
})

Widget.displayName = 'Widget'

export default Widget

