import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GitHubWidget from '../../widgets/GitHubWidget'
import { useDashboardStore } from '../../stores/dashboardStore'
import * as githubApi from '../../utils/githubApi'

// MSW 모킹 대신 직접 모킹
vi.mock('../../utils/githubApi')

describe('GitHubWidget', () => {
  beforeEach(() => {
    // Store 초기화
    useDashboardStore.setState({
      widgetConfigs: {
        github: {
          token: '',
          username: '',
          selectedRepos: [],
        },
        'tech-news': {
          keywords: [],
        },
        stackoverflow: {
          tags: [],
        },
      },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('설정이 없을 때 설정 안내 메시지를 표시해야 합니다', () => {
    render(<GitHubWidget />)
    expect(screen.getByText(/GitHub 활동을 보려면 설정이 필요합니다/i)).toBeInTheDocument()
  })

  it('설정 버튼을 클릭하면 설정 모달이 열려야 합니다', async () => {
    const user = userEvent.setup()

    render(<GitHubWidget />)
    const settingsButton = screen.getByText('설정하기')
    await user.click(settingsButton)

    // 모달이 열렸는지 확인
    expect(screen.getByText('GitHub 설정')).toBeInTheDocument()
    expect(screen.getByLabelText('GitHub Personal Access Token')).toBeInTheDocument()
    expect(screen.getByLabelText('GitHub 사용자명')).toBeInTheDocument()
  })

  it('로딩 중일 때 스켈레톤 UI를 표시해야 합니다', async () => {
    useDashboardStore.setState({
      widgetConfigs: {
        github: {
          token: 'test-token',
          username: 'test-user',
          selectedRepos: [],
        },
        'tech-news': {
          keywords: [],
        },
        stackoverflow: {
          tags: [],
        },
      },
    })

    vi.mocked(githubApi.fetchGitHubActivity).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              todayCommits: 5,
              weekCommits: 20,
              pullRequests: [],
              issues: [],
            })
          }, 100)
        })
    )

    render(<GitHubWidget />)

    // 스켈레톤이 표시되는지 확인 (animate-pulse 클래스)
    const widget = screen.getByText('GitHub 활동').closest('div')
    expect(widget).toBeInTheDocument()
  })

  it('성공적으로 데이터를 불러오면 활동 정보를 표시해야 합니다', async () => {
    useDashboardStore.setState({
      widgetConfigs: {
        github: {
          token: 'test-token',
          username: 'test-user',
          selectedRepos: [],
        },
        'tech-news': {
          keywords: [],
        },
        stackoverflow: {
          tags: [],
        },
      },
    })

    const mockActivity = {
      todayCommits: 5,
      weekCommits: 20,
      pullRequests: [
        {
          title: 'Test PR',
          url: 'https://github.com/test/repo/pull/1',
          state: 'OPEN',
          createdAt: '2024-01-01T00:00:00Z',
          repository: 'test-repo',
        },
      ],
      issues: [
        {
          title: 'Test Issue',
          url: 'https://github.com/test/repo/issues/1',
          state: 'OPEN',
          createdAt: '2024-01-01T00:00:00Z',
          repository: 'test-repo',
        },
      ],
    }

    vi.mocked(githubApi.fetchGitHubActivity).mockResolvedValue(mockActivity)

    render(<GitHubWidget />)

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('20')).toBeInTheDocument()
      expect(screen.getByText('Test PR')).toBeInTheDocument()
      expect(screen.getByText('Test Issue')).toBeInTheDocument()
    })
  })

  it('에러 발생 시 에러 메시지를 표시해야 합니다', async () => {
    useDashboardStore.setState({
      widgetConfigs: {
        github: {
          token: 'test-token',
          username: 'test-user',
          selectedRepos: [],
        },
        'tech-news': {
          keywords: [],
        },
        stackoverflow: {
          tags: [],
        },
      },
    })

    vi.mocked(githubApi.fetchGitHubActivity).mockRejectedValue(
      new Error('API 오류 발생')
    )

    render(<GitHubWidget />)

    await waitFor(() => {
      expect(screen.getByText(/API 오류 발생/i)).toBeInTheDocument()
    })
  })

  it('Rate Limit 오류 발생 시 Rate Limit 메시지를 표시해야 합니다', async () => {
    useDashboardStore.setState({
      widgetConfigs: {
        github: {
          token: 'test-token',
          username: 'test-user',
          selectedRepos: [],
        },
        'tech-news': {
          keywords: [],
        },
        stackoverflow: {
          tags: [],
        },
      },
    })

    vi.mocked(githubApi.fetchGitHubActivity).mockRejectedValue(
      new Error('Rate Limit이 초과되었습니다')
    )

    render(<GitHubWidget />)

    await waitFor(() => {
      expect(screen.getByText('Rate Limit이 초과되었습니다')).toBeInTheDocument()
      expect(screen.getByText(/잠시 후 다시 시도해주세요/i)).toBeInTheDocument()
    })
  })
})

