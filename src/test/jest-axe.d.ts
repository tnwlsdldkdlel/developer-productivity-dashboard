declare module 'jest-axe' {
  export interface Violation {
    id: string
    help: string
    helpUrl?: string
    nodes?: Array<{
      html: string
      target: string[]
    }>
  }

  export interface AxeResults {
    violations: Violation[]
    passes?: Violation[]
    incomplete?: Violation[]
    inapplicable?: Violation[]
  }

  export default function axe(
    container: HTMLElement,
    options?: Record<string, unknown>
  ): Promise<AxeResults>
}

