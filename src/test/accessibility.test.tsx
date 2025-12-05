import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import App from '../App'

describe('접근성 테스트', () => {
  it('App 컴포넌트가 접근성 가이드라인을 준수해야 합니다', async () => {
    const { container } = render(<App />)
    // setup.ts에서 정의한 커스텀 matcher 사용
    await expect(container).toHaveNoViolations()
  })
})

