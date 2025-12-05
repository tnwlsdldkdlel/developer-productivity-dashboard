import { useState, useEffect, useRef, useCallback } from 'react'
import { Newspaper, ExternalLink, Clock } from 'lucide-react'
import { useDashboardStore } from '../stores/dashboardStore'
import { fetchTechNews, invalidateTechNewsCache, type NewsArticle } from '../utils/newsApi'
import Widget from '../components/Widget'
import Skeleton from '../components/Skeleton'
import ErrorState from '../components/ErrorState'
import Modal from '../components/Modal'
import ColorPicker from '../components/ColorPicker'

type WidgetState = 'idle' | 'loading' | 'success' | 'error'

const TechNewsWidget = () => {
  const { widgetConfigs, updateTechNewsConfig, widgetBackgroundColors, updateWidgetBackgroundColor } = useDashboardStore()
  const { keywords } = widgetConfigs['tech-news']
  const backgroundColor = widgetBackgroundColors['tech-news']

  const [state, setState] = useState<WidgetState>('idle')
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formKeywords, setFormKeywords] = useState('')
  const [formBackgroundColor, setFormBackgroundColor] = useState<string>(backgroundColor || '')
  const prevKeywordsRef = useRef<string>('')

  // 모달이 열릴 때 현재 설정값으로 폼 초기화
  useEffect(() => {
    if (isModalOpen) {
      setFormKeywords(keywords.join(', '))
      setFormBackgroundColor(backgroundColor || '')
    }
  }, [isModalOpen, keywords, backgroundColor])

  const loadNews = useCallback(
    async (skipCache: boolean = false) => {
      if (keywords.length === 0) {
        setState('idle')
        return
      }

      setState('loading')
      setErrorMessage('')

      try {
        const data = await fetchTechNews({ keywords }, skipCache)
        setArticles(data)
        setState('success')
      } catch (error) {
        const message = error instanceof Error ? error.message : '뉴스를 불러올 수 없습니다.'
        setErrorMessage(message)
        setState('error')
      }
    },
    [keywords]
  )

  // 키워드 변경 감지 및 자동 로딩
  useEffect(() => {
    const keywordsKey = keywords.join(',')
    if (keywordsKey !== prevKeywordsRef.current) {
      invalidateTechNewsCache(keywords)
      loadNews(true)
      prevKeywordsRef.current = keywordsKey
    } else if (keywords.length > 0) {
      loadNews()
    }
  }, [keywords, loadNews])

  const handleSettingsClick = () => {
    setIsModalOpen(true)
  }

  useEffect(() => {
    if (isModalOpen) {
      setFormKeywords(keywords.join(', '))
      setFormBackgroundColor(backgroundColor || '')
    }
  }, [isModalOpen, keywords, backgroundColor])

  const handleModalClose = () => {
    setIsModalOpen(false)
    setFormKeywords('')
    setFormBackgroundColor('')
  }

  const handleSave = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    const newKeywords = formKeywords
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0)

    if (newKeywords.length > 0) {
      updateTechNewsConfig({ keywords: newKeywords })
      updateWidgetBackgroundColor('tech-news', formBackgroundColor)
      handleModalClose()
    }
  }

  const handleCancel = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    handleModalClose()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
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
      <Widget title="기술 뉴스" onSettingsClick={handleSettingsClick} backgroundColor={backgroundColor}>
        {state === 'loading' && <Skeleton />}
        {state === 'error' && (
          <ErrorState message={errorMessage} onRetry={() => loadNews(true)} />
        )}
        {state === 'success' && (
          <div className="space-y-3">
            {articles.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>뉴스가 없습니다.</p>
                <p className="text-sm mt-1">설정에서 키워드를 추가해보세요.</p>
              </div>
            ) : (
              articles.map((article) => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 mb-1">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-2">
                        <span>{article.author.name}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {article.readingTimeMinutes}분
                        </span>
                        <span>{formatDate(article.publishedAt)}</span>
                      </div>
                      {article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {article.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
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
        {state === 'idle' && keywords.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <Newspaper className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              기술 뉴스를 보려면 키워드 설정이 필요합니다.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
              설정 아이콘을 클릭하여 관심 있는 키워드를 추가하세요.
            </p>
            <button
              onClick={handleSettingsClick}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              키워드 설정
            </button>
          </div>
        )}
      </Widget>

      <Modal isOpen={isModalOpen} onClose={handleModalClose} title="기술 뉴스 설정">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="tech-news-keywords"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              키워드 (쉼표로 구분)
            </label>
            <input
              id="tech-news-keywords"
              type="text"
              value={formKeywords}
              onChange={(e) => setFormKeywords(e.target.value)}
              placeholder="React, TypeScript, JavaScript"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              aria-label="기술 뉴스 키워드"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              관심 있는 기술 키워드를 쉼표로 구분하여 입력하세요. (예: React, TypeScript)
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
              disabled={!formKeywords.trim()}
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

export default TechNewsWidget

