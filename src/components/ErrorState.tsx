/**
 * 에러 상태 컴포넌트
 * PRD 요구사항: 위젯 단위 오류 처리 및 "다시 시도" 버튼
 */

import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
  isRateLimit?: boolean
}

const ErrorState = ({ message, onRetry, isRateLimit = false }: ErrorStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mb-4" />
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{message}</p>
      {isRateLimit && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
          Rate Limit이 초과되었습니다. 잠시 후 다시 시도해주세요.
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center gap-2"
          aria-label="다시 시도"
        >
          <RefreshCw className="w-4 h-4" />
          다시 시도
        </button>
      )}
    </div>
  )
}

export default ErrorState

