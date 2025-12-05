/**
 * Error Boundary 컴포넌트
 * React 컴포넌트 트리에서 발생한 JavaScript 에러를 캐치하고 처리
 * PRD 요구사항: 위젯 단위 오류 처리 및 "다시 시도" 버튼
 */

import { Component, ReactNode, ErrorInfo } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
  widgetName?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 로깅 (실제 프로덕션에서는 에러 리포팅 서비스로 전송)
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
    // 부모 컴포넌트에서 제공한 리셋 핸들러 호출
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 제공되면 사용
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 기본 에러 UI
      return (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {this.props.widgetName ? `${this.props.widgetName} 위젯 오류` : '위젯 오류'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            예상치 못한 오류가 발생했습니다.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 text-left max-w-md">
              <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-400 mb-2">
                에러 상세 정보 (개발 모드)
              </summary>
              <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleReset}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center gap-2"
            aria-label="다시 시도"
          >
            <RefreshCw className="w-4 h-4" />
            다시 시도
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

