import { Assertion } from 'vitest'
import type { AxeResults } from 'jest-axe'

declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): Promise<void>
  }
}

declare module 'jest-axe' {
  export interface Violation {
    id: string
    help: string
    helpUrl?: string
  }

  export interface AxeResults {
    violations: Violation[]
  }

  export default function axe(container: HTMLElement): Promise<AxeResults>
}

