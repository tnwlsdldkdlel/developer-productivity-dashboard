import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App 컴포넌트', () => {
  it('렌더링이 정상적으로 동작해야 합니다', () => {
    render(<App />)
    expect(screen.getByText(/개발자 생산성 대시보드/i)).toBeInTheDocument()
  })
})

