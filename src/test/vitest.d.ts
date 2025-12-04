declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): Promise<void>
  }
}

