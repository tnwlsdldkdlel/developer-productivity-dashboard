import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import GitHubWidget from '../../widgets/GitHubWidget'
import { useDashboardStore } from '../../stores/dashboardStore'

describe('GitHubWidget 접근성 테스트', () => {
  it('GitHubWidget 컴포넌트가 접근성 가이드라인을 준수해야 합니다', async () => {
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

    const { container } = render(<GitHubWidget />)
    await expect(container).toHaveNoViolations()
  })
})

