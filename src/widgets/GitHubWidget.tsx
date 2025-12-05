import { useState, useEffect, useRef, useCallback } from 'react'
import { GitBranch, GitPullRequest, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDashboardStore } from '../stores/dashboardStore'
import { fetchGitHubActivity, invalidateGitHubActivityCache, type GitHubActivity } from '../utils/githubApi'
import Widget from '../components/Widget'
import Skeleton from '../components/Skeleton'
import ErrorState from '../components/ErrorState'
import Modal from '../components/Modal'

type WidgetState = 'idle' | 'loading' | 'success' | 'error' | 'rate-limit'

const GitHubWidget = () => {
  const { widgetConfigs, updateGitHubConfig } = useDashboardStore()
  const { token, username, selectedRepos } = widgetConfigs.github

  const [state, setState] = useState<WidgetState>('idle')
  const [activity, setActivity] = useState<GitHubActivity | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formToken, setFormToken] = useState('')
  const [formUsername, setFormUsername] = useState('')
  const prevConfigRef = useRef<{ token: string; username: string; repos: string }>()

  // 모달이 열릴 때 현재 설정값으로 폼 초기화
  useEffect(() => {
    if (isModalOpen) {
      setFormToken(token || '')
      setFormUsername(username || '')
    }
  }, [isModalOpen, token, username])

  const loadActivity = useCallback(
    async (skipCache: boolean = false) => {
      if (!token || !username) {
        setState('idle')
        return
      }

      setState('loading')
      setErrorMessage('')

      try {
        const data = await fetchGitHubActivity(
          { token, username },
          selectedRepos,
          skipCache
        )
        setActivity(data)
        setState('success')
      } catch (error) {
        const message = error instanceof Error ? error.message : '데이터를 불러올 수 없습니다.'
        setErrorMessage(message)

        if (message.includes('Rate Limit') || message.includes('403') || message.includes('429')) {
          setState('rate-limit')
          toast.error('GitHub API 요청 한도가 초과되었습니다')
        } else {
          setState('error')
          toast.error('GitHub 활동 데이터를 불러올 수 없습니다')
        }
      }
    },
    [token, username, selectedRepos]
  )

  // 설정 변경 감지 및 자동 로딩
  useEffect(() => {
    if (token && username) {
      const selectedReposKey = selectedRepos.join(',')
      const currentConfig = {
        token,
        username,
        repos: selectedReposKey,
      }
      const prevConfig = prevConfigRef.current

      // 설정이 변경되었는지 확인
      const configChanged =
        !prevConfig ||
        prevConfig.token !== currentConfig.token ||
        prevConfig.username !== currentConfig.username ||
        prevConfig.repos !== currentConfig.repos

      if (configChanged) {
        // 설정이 변경되었으면 캐시 무효화하고 새로 로드
        invalidateGitHubActivityCache(username, selectedRepos)
        loadActivity(true) // skipCache = true로 캐시 무시하고 새로 로드
        prevConfigRef.current = currentConfig
      } else {
        // 설정이 변경되지 않았으면 일반 로드 (캐시 사용)
        loadActivity(false)
      }
    }
  }, [token, username, selectedRepos, loadActivity])

  const handleSettingsClick = () => {
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    // 폼 초기화
    setFormToken('')
    setFormUsername('')
  }

  const handleSave = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (formToken.trim() && formUsername.trim()) {
      const newToken = formToken.trim()
      const newUsername = formUsername.trim()
      
      // 설정 저장
      updateGitHubConfig({
        token: newToken,
        username: newUsername,
      })
      
      // 캐시 무효화 (설정 변경 전의 캐시 삭제)
      invalidateGitHubActivityCache(username, selectedRepos)
      
      // 모달 닫기
      handleModalClose()
      
      // 설정이 변경되면 useEffect가 자동으로 감지하여 데이터를 다시 불러옴
    }
  }

  const handleCancel = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    handleModalClose()
  }

  const isConfigured = token && username

  return (
    <>
      <Widget title="GitHub 활동" onSettingsClick={handleSettingsClick}>
      {!isConfigured ? (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <GitBranch className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            GitHub 활동을 보려면 설정이 필요합니다.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
            설정 아이콘을 클릭하여 Token과 사용자명을 입력하세요.
          </p>
          <button
            onClick={handleSettingsClick}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            설정하기
          </button>
        </div>
      ) : state === 'loading' ? (
        <Skeleton />
      ) : state === 'error' || state === 'rate-limit' ? (
        <ErrorState
          message={errorMessage || '데이터를 불러올 수 없습니다.'}
          onRetry={loadActivity}
          isRateLimit={state === 'rate-limit'}
        />
      ) : state === 'success' && activity ? (
        <div className="space-y-4">
          {/* 커밋 통계 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">오늘 커밋</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {activity.todayCommits}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">최근 7일</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {activity.weekCommits}
              </p>
            </div>
          </div>

          {/* 커밋 목록 */}
          {activity.commits.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  최근 커밋
                </h3>
              </div>
              <div className="space-y-2">
                {activity.commits.slice(0, 5).map((commit, index) => (
                  <a
                    key={index}
                    href={commit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-gray-900 dark:text-white flex-1 line-clamp-2 break-words">
                        {commit.message}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono flex-shrink-0 ml-2">
                        {commit.sha}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {commit.repository}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* PR 목록 */}
          {activity.pullRequests.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <GitPullRequest className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Pull Requests
                </h3>
              </div>
              <div className="space-y-2">
                {activity.pullRequests.slice(0, 5).map((pr, index) => (
                  <a
                    key={index}
                    href={pr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-gray-900 dark:text-white flex-1 truncate">
                        {pr.title}
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          pr.state === 'OPEN'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : pr.state === 'MERGED'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {pr.state}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {pr.repository}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Issue 목록 */}
          {activity.issues.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Issues</h3>
              </div>
              <div className="space-y-2">
                {activity.issues.slice(0, 5).map((issue, index) => (
                  <a
                    key={index}
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-gray-900 dark:text-white flex-1 truncate">
                        {issue.title}
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          issue.state === 'OPEN'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {issue.state}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {issue.repository}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 빈 상태 */}
          {activity.commits.length === 0 && activity.pullRequests.length === 0 && activity.issues.length === 0 && (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <p className="text-sm">활동 내역이 없습니다.</p>
            </div>
          )}

          {/* Rate Limit 정보 */}
          {activity.rateLimit && activity.rateLimit.remaining < 10 && (
            <div className="mt-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-700 dark:text-yellow-400">
              ⚠️ API 요청 한도가 거의 소진되었습니다. ({activity.rateLimit.remaining}/
              {activity.rateLimit.limit} 남음)
            </div>
          )}
        </div>
      ) : null}
      </Widget>

      {/* 설정 모달 */}
      <Modal isOpen={isModalOpen} onClose={handleModalClose} title="GitHub 설정">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="github-token"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Personal Access Token
            </label>
            <input
              id="github-token"
              type="password"
              value={formToken}
              onChange={(e) => setFormToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              aria-label="GitHub Personal Access Token"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              GitHub에서 Personal Access Token을 생성하여 입력하세요.
            </p>
          </div>

          <div>
            <label
              htmlFor="github-username"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              사용자명
            </label>
            <input
              id="github-username"
              type="text"
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              placeholder="octocat"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              aria-label="GitHub 사용자명"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={!formToken.trim() || !formUsername.trim()}
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

export default GitHubWidget

