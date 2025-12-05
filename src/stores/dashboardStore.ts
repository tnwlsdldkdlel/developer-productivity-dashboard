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

export type SavedLayouts = {
  [name: string]: {
    lg: LayoutItem[]
    md: LayoutItem[]
    sm: LayoutItem[]
    xs: LayoutItem[]
  }
}

interface DashboardState {
  // 현재 레이아웃 정보
  layouts: {
    lg: LayoutItem[]
    md: LayoutItem[]
    sm: LayoutItem[]
    xs: LayoutItem[]
  }

  // 저장된 레이아웃 프리셋
  savedLayouts: SavedLayouts

  // 현재 선택된 레이아웃 이름
  currentLayoutName: string

  // 위젯 설정
  widgetConfigs: {
    github: GitHubWidgetConfig
    'tech-news': TechNewsWidgetConfig
    stackoverflow: StackOverflowWidgetConfig
  }

  // 위젯 배경색 설정 (위젯 ID별)
  widgetBackgroundColors: {
    [widgetId: string]: string // hex 색상 코드
  }

  // 액션
  updateLayout: (breakpoint: 'lg' | 'md' | 'sm' | 'xs', layout: LayoutItem[]) => void
  resetLayouts: () => void
  saveLayout: (name: string) => void
  loadLayout: (name: string) => void
  deleteLayout: (name: string) => void
  renameLayout: (oldName: string, newName: string) => void
  updateGitHubConfig: (config: Partial<GitHubWidgetConfig>) => void
  updateTechNewsConfig: (config: Partial<TechNewsWidgetConfig>) => void
  updateStackOverflowConfig: (config: Partial<StackOverflowWidgetConfig>) => void
  updateWidgetBackgroundColor: (widgetId: string, color: string) => void
}

const defaultLayouts = {
  lg: [
    { i: 'github', x: 0, y: 0, w: 6, h: 5, minW: 4, minH: 4 },
    { i: 'todo', x: 6, y: 0, w: 6, h: 5, minW: 4, minH: 4 },
    { i: 'tech-news', x: 0, y: 5, w: 6, h: 5, minW: 4, minH: 4 },
    { i: 'stackoverflow', x: 6, y: 5, w: 6, h: 5, minW: 4, minH: 4 },
  ],
  md: [
    { i: 'github', x: 0, y: 0, w: 6, h: 5, minW: 4, minH: 4 },
    { i: 'todo', x: 6, y: 0, w: 6, h: 5, minW: 4, minH: 4 },
    { i: 'tech-news', x: 0, y: 5, w: 6, h: 5, minW: 4, minH: 4 },
    { i: 'stackoverflow', x: 6, y: 5, w: 6, h: 5, minW: 4, minH: 4 },
  ],
  sm: [
    { i: 'github', x: 0, y: 0, w: 12, h: 5, minW: 4, minH: 4 },
    { i: 'todo', x: 0, y: 5, w: 12, h: 5, minW: 4, minH: 4 },
    { i: 'tech-news', x: 0, y: 10, w: 12, h: 5, minW: 4, minH: 4 },
    { i: 'stackoverflow', x: 0, y: 15, w: 12, h: 5, minW: 4, minH: 4 },
  ],
  xs: [
    { i: 'github', x: 0, y: 0, w: 12, h: 5, minW: 4, minH: 4 },
    { i: 'todo', x: 0, y: 5, w: 12, h: 5, minW: 4, minH: 4 },
    { i: 'tech-news', x: 0, y: 10, w: 12, h: 5, minW: 4, minH: 4 },
    { i: 'stackoverflow', x: 0, y: 15, w: 12, h: 5, minW: 4, minH: 4 },
  ],
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      layouts: defaultLayouts,
      savedLayouts: {
        '기본 레이아웃': defaultLayouts,
      },
      currentLayoutName: '기본 레이아웃',
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
      widgetBackgroundColors: {},
      updateLayout: (breakpoint, layout) =>
        set((state) => ({
          layouts: {
            ...state.layouts,
            [breakpoint]: layout,
          },
          // 현재 레이아웃 이름이 있으면 자동 저장
          savedLayouts: state.currentLayoutName
            ? {
                ...state.savedLayouts,
                [state.currentLayoutName]: {
                  ...state.layouts,
                  [breakpoint]: layout,
                },
              }
            : state.savedLayouts,
        })),
      resetLayouts: () =>
        set(() => ({
          layouts: defaultLayouts,
        })),
      saveLayout: (name: string) =>
        set((state) => ({
          savedLayouts: {
            ...state.savedLayouts,
            [name]: { ...state.layouts },
          },
          currentLayoutName: name,
        })),
      loadLayout: (name: string) =>
        set((state) => {
          const layout = state.savedLayouts[name]
          if (layout) {
            return {
              layouts: { ...layout },
              currentLayoutName: name,
            }
          }
          return state
        }),
      deleteLayout: (name: string) =>
        set((state) => {
          const newSavedLayouts = { ...state.savedLayouts }
          delete newSavedLayouts[name]
          
          // 삭제한 레이아웃이 현재 레이아웃이면 기본 레이아웃으로 전환
          const newCurrentLayoutName =
            state.currentLayoutName === name && Object.keys(newSavedLayouts).length > 0
              ? Object.keys(newSavedLayouts)[0]
              : state.currentLayoutName === name
              ? '기본 레이아웃'
              : state.currentLayoutName

          return {
            savedLayouts: newSavedLayouts,
            currentLayoutName: newCurrentLayoutName,
            layouts:
              state.currentLayoutName === name && newSavedLayouts[newCurrentLayoutName]
                ? { ...newSavedLayouts[newCurrentLayoutName] }
                : state.layouts,
          }
        }),
      renameLayout: (oldName: string, newName: string) =>
        set((state) => {
          if (oldName === newName || !state.savedLayouts[oldName]) return state

          const newSavedLayouts = { ...state.savedLayouts }
          newSavedLayouts[newName] = newSavedLayouts[oldName]
          delete newSavedLayouts[oldName]

          return {
            savedLayouts: newSavedLayouts,
            currentLayoutName:
              state.currentLayoutName === oldName ? newName : state.currentLayoutName,
          }
        }),
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
      updateWidgetBackgroundColor: (widgetId: string, color: string) =>
        set((state) => ({
          widgetBackgroundColors: {
            ...state.widgetBackgroundColors,
            [widgetId]: color,
          },
        })),
    }),
    {
      name: 'd-prod-dashboard-storage',
    }
  )
)

