import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type ReactGridLayout from 'react-grid-layout'

export type LayoutItem = ReactGridLayout.Layout

export interface GitHubWidgetConfig {
  token: string
  username: string
  selectedRepos: string[]
}

export interface TechNewsWidgetConfig {
  keywords: string[]
}

export interface StackOverflowWidgetConfig {
  tags: string[]
  apiKey?: string
}

interface DashboardState {
  // 레이아웃 정보
  layouts: {
    lg: LayoutItem[]
    md: LayoutItem[]
    sm: LayoutItem[]
    xs: LayoutItem[]
  }

  // 위젯 설정
  widgetConfigs: {
    github: GitHubWidgetConfig
    'tech-news': TechNewsWidgetConfig
    stackoverflow: StackOverflowWidgetConfig
  }

  // 액션
  updateLayout: (breakpoint: 'lg' | 'md' | 'sm' | 'xs', layout: LayoutItem[]) => void
  updateGitHubConfig: (config: Partial<GitHubWidgetConfig>) => void
  updateTechNewsConfig: (config: Partial<TechNewsWidgetConfig>) => void
  updateStackOverflowConfig: (config: Partial<StackOverflowWidgetConfig>) => void
}

const defaultLayouts = {
  lg: [
    { i: 'github', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'todo', x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'tech-news', x: 0, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'stackoverflow', x: 6, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
  ],
  md: [
    { i: 'github', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'todo', x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'tech-news', x: 0, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'stackoverflow', x: 6, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
  ],
  sm: [
    { i: 'github', x: 0, y: 0, w: 12, h: 4, minW: 4, minH: 3 },
    { i: 'todo', x: 0, y: 4, w: 12, h: 4, minW: 4, minH: 3 },
    { i: 'tech-news', x: 0, y: 8, w: 12, h: 4, minW: 4, minH: 3 },
    { i: 'stackoverflow', x: 0, y: 12, w: 12, h: 4, minW: 4, minH: 3 },
  ],
  xs: [
    { i: 'github', x: 0, y: 0, w: 12, h: 4, minW: 4, minH: 3 },
    { i: 'todo', x: 0, y: 4, w: 12, h: 4, minW: 4, minH: 3 },
    { i: 'tech-news', x: 0, y: 8, w: 12, h: 4, minW: 4, minH: 3 },
    { i: 'stackoverflow', x: 0, y: 12, w: 12, h: 4, minW: 4, minH: 3 },
  ],
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      layouts: defaultLayouts,
      widgetConfigs: {
        github: {
          token: '',
          username: '',
          selectedRepos: [],
        },
        'tech-news': {
          keywords: ['React', 'TypeScript', 'JavaScript'],
        },
        stackoverflow: {
          tags: ['reactjs', 'javascript', 'typescript'],
        },
      },
      updateLayout: (breakpoint, layout) =>
        set((state) => ({
          layouts: {
            ...state.layouts,
            [breakpoint]: layout,
          },
        })),
      updateGitHubConfig: (config) =>
        set((state) => ({
          widgetConfigs: {
            ...state.widgetConfigs,
            github: {
              ...state.widgetConfigs.github,
              ...config,
            },
          },
        })),
      updateTechNewsConfig: (config) =>
        set((state) => ({
          widgetConfigs: {
            ...state.widgetConfigs,
            'tech-news': {
              ...state.widgetConfigs['tech-news'],
              ...config,
            },
          },
        })),
      updateStackOverflowConfig: (config) =>
        set((state) => ({
          widgetConfigs: {
            ...state.widgetConfigs,
            stackoverflow: {
              ...state.widgetConfigs.stackoverflow,
              ...config,
            },
          },
        })),
    }),
    {
      name: 'd-prod-dashboard-storage',
    }
  )
)

