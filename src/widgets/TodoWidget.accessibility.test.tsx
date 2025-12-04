import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import TodoWidget from './TodoWidget'

describe('TodoWidget 접근성 테스트', () => {
  it('TodoWidget이 접근성 가이드라인을 준수해야 합니다', async () => {
    const { container } = render(<TodoWidget />)
    await expect(container).toHaveNoViolations()
  })
})

