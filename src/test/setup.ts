import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// 각 테스트 후 cleanup
afterEach(() => {
  cleanup()
})

// jest-axe를 vitest와 함께 사용하기 위한 설정
expect.extend({
  async toHaveNoViolations(received: HTMLElement) {
    const { axe } = await import('jest-axe')
    const results = await axe(received)
    
    if (results.violations.length === 0) {
      return {
        message: () => '접근성 위반이 없습니다.',
        pass: true,
      }
    }
    
    return {
      message: () => {
        const violations = results.violations
          .map((v: { id: string; help: string }) => `- ${v.id}: ${v.help}`)
          .join('\n')
        return `접근성 위반 발견:\n${violations}`
      },
      pass: false,
    }
  },
})

