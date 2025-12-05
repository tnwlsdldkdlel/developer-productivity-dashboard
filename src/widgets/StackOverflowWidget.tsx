import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageSquare, ExternalLink, TrendingUp, CheckCircle } from 'lucide-react'
import { useDashboardStore } from '../stores/dashboardStore'
import {
  fetchStackOverflowQuestionsData,
  invalidateStackOverflowCache,
  type StackOverflowQuestion,
} from '../utils/stackoverflowApi'
import Widget from '../components/Widget'
import Skeleton from '../components/Skeleton'
import ErrorState from '../components/ErrorState'
import Modal from '../components/Modal'
import ColorPicker from '../components/ColorPicker'

type WidgetState = 'idle' | 'loading' | 'success' | 'error'

const StackOverflowWidget = () => {
  const { widgetConfigs, updateStackOverflowConfig, widgetBackgroundColors, updateWidgetBackgroundColor } = useDashboardStore()
  const { tags, apiKey } = widgetConfigs.stackoverflow
  const backgroundColor = widgetBackgroundColors['stackoverflow']

  const [state, setState] = useState<WidgetState>('idle')
  const [questions, setQuestions] = useState<StackOverflowQuestion[]>([])
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formTags, setFormTags] = useState('')
  const [formApiKey, setFormApiKey] = useState('')
  const [formBackgroundColor, setFormBackgroundColor] = useState<string>(backgroundColor || '')
  const prevConfigRef = useRef<{ tags: string; apiKey: string }>()

  // 모달이 열릴 때 현재 설정값으로 폼 초기화
  useEffect(() => {
    if (isModalOpen) {
      setFormTags(tags.join(', '))
      setFormApiKey(apiKey || '')
      setFormBackgroundColor(backgroundColor || '')
    }
  }, [isModalOpen, tags, apiKey, backgroundColor])

  const loadQuestions = useCallback(
    async (skipCache: boolean = false) => {
      if (tags.length === 0) {
        setState('idle')
        return
      }

      setState('loading')
      setErrorMessage('')

      try {
        const data = await fetchStackOverflowQuestionsData({ tags, apiKey }, skipCache)
        setQuestions(data)
        setState('success')
      } catch (error) {
        const message = error instanceof Error ? error.message : '질문을 불러올 수 없습니다.'
        setErrorMessage(message)
        setState('error')
      }
    },
    [tags, apiKey]
  )

  // 설정 변경 감지 및 자동 로딩
  useEffect(() => {
    const tagsKey = tags.join(',')
    const currentConfig = { tags: tagsKey, apiKey: apiKey || '' }
    const prevConfig = prevConfigRef.current

    if (!prevConfig || prevConfig.tags !== currentConfig.tags || prevConfig.apiKey !== currentConfig.apiKey) {
      invalidateStackOverflowCache(tags, apiKey)
      loadQuestions(true)
      prevConfigRef.current = currentConfig
    } else if (tags.length > 0) {
      loadQuestions()
    }
  }, [tags, apiKey, loadQuestions])

  const handleSettingsClick = () => {
    setIsModalOpen(true)
  }

  useEffect(() => {
    if (isModalOpen) {
      setFormTags(tags.join(', '))
      setFormApiKey(apiKey || '')
      setFormBackgroundColor(backgroundColor || '')
    }
  }, [isModalOpen, tags, apiKey, backgroundColor])

  const handleModalClose = () => {
    setIsModalOpen(false)
    setFormTags('')
    setFormApiKey('')
    setFormBackgroundColor('')
  }

  const handleSave = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    const newTags = formTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    if (newTags.length > 0) {
      updateStackOverflowConfig({
        tags: newTags,
        apiKey: formApiKey.trim() || undefined,
      })
      updateWidgetBackgroundColor('stackoverflow', formBackgroundColor)
      handleModalClose()
    }
  }

  const handleCancel = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    handleModalClose()
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return '오늘'
    } else if (diffDays === 1) {
      return '어제'
    } else if (diffDays < 7) {
      return `${diffDays}일 전`
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    }
  }

  return (
    <>
      <Widget title="Stack Overflow" onSettingsClick={handleSettingsClick} backgroundColor={backgroundColor}>
        {state === 'loading' && <Skeleton />}
        {state === 'error' && (
          <ErrorState message={errorMessage} onRetry={() => loadQuestions(true)} />
        )}
        {state === 'success' && (
          <div className="space-y-3">
            {questions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>질문이 없습니다.</p>
                <p className="text-sm mt-1">설정에서 태그를 추가해보세요.</p>
              </div>
            ) : (
              questions.map((question) => (
                <a
                  key={question.questionId}
                  href={question.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-2">
                        {question.isAnswered && (
                          <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        )}
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">
                          {question.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {question.score}
                        </span>
                        <span>{question.answerCount} 답변</span>
                        <span>{question.viewCount.toLocaleString()} 조회</span>
                        <span>{formatDate(question.creationDate)}</span>
                      </div>
                      {question.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {question.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-1" />
                  </div>
                </a>
              ))
            )}
          </div>
        )}
        {state === 'idle' && tags.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Stack Overflow 질문을 보려면 태그 설정이 필요합니다.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
              설정 아이콘을 클릭하여 관심 있는 태그를 추가하세요.
            </p>
            <button
              onClick={handleSettingsClick}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              태그 설정
            </button>
          </div>
        )}
      </Widget>

      <Modal isOpen={isModalOpen} onClose={handleModalClose} title="Stack Overflow 설정">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="so-tags"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              태그 (쉼표로 구분)
            </label>
            <input
              id="so-tags"
              type="text"
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
              placeholder="reactjs, javascript, typescript"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              aria-label="Stack Overflow 태그"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              관심 있는 태그를 쉼표로 구분하여 입력하세요. (예: reactjs, javascript)
            </p>
          </div>

          <div>
            <label
              htmlFor="so-api-key"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              API 키 (선택사항)
            </label>
            <input
              id="so-api-key"
              type="password"
              value={formApiKey}
              onChange={(e) => setFormApiKey(e.target.value)}
              placeholder="API 키를 입력하세요 (선택사항)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              aria-label="Stack Overflow API 키"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              API 키를 입력하면 더 높은 Rate Limit을 사용할 수 있습니다. (선택사항)
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <ColorPicker
              value={formBackgroundColor}
              onChange={setFormBackgroundColor}
              label="위젯 배경색"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={!formTags.trim()}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              type="button"
            >
              저장
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              type="button"
            >
              취소
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default StackOverflowWidget

