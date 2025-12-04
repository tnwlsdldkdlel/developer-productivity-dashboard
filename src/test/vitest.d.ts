import 'vitest/globals'

declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): Promise<void>
  }
}

