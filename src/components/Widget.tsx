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
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 h-full flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="설정"
          >
            <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}

export default Widget

