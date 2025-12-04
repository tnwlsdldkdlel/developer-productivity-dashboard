import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TodoWidget from '../../widgets/TodoWidget'
import { useTodoStore } from '../../stores/todoStore'

describe('TodoWidget', () => {
  beforeEach(() => {
    // 각 테스트 전에 store 초기화
    useTodoStore.setState({ todos: [] })
  })

  it('할 일 위젯이 렌더링되어야 합니다', () => {
    render(<TodoWidget />)
    expect(screen.getByText('오늘 할 일')).toBeInTheDocument()
  })

  it('할 일을 추가할 수 있어야 합니다', async () => {
    const user = userEvent.setup()
    render(<TodoWidget />)

    const input = screen.getByPlaceholderText('새 할 일 추가...')
    const addButton = screen.getByLabelText('할 일 추가')

    await user.type(input, '테스트 할 일')
    await user.click(addButton)

    expect(screen.getByText('테스트 할 일')).toBeInTheDocument()
  })

  it('Enter 키로 할 일을 추가할 수 있어야 합니다', async () => {
    const user = userEvent.setup()
    render(<TodoWidget />)

    const input = screen.getByPlaceholderText('새 할 일 추가...')
    await user.type(input, 'Enter로 추가{Enter}')

    expect(screen.getByText('Enter로 추가')).toBeInTheDocument()
  })

  it('할 일을 완료 처리할 수 있어야 합니다', async () => {
    const user = userEvent.setup()
    useTodoStore.setState({
      todos: [
        {
          id: '1',
          text: '테스트 할 일',
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
    })

    render(<TodoWidget />)

    const checkbox = screen.getByLabelText('테스트 할 일 완료')
    await user.click(checkbox)

    expect(checkbox).toBeChecked()
    expect(screen.getByText('완료됨')).toBeInTheDocument()
  })

  it('할 일을 삭제할 수 있어야 합니다', async () => {
    const user = userEvent.setup()
    useTodoStore.setState({
      todos: [
        {
          id: '1',
          text: '삭제할 할 일',
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
    })

    render(<TodoWidget />)

    const deleteButton = screen.getByLabelText('삭제할 할 일 삭제')
    await user.click(deleteButton)

    expect(screen.queryByText('삭제할 할 일')).not.toBeInTheDocument()
  })

  it('빈 상태 메시지를 표시해야 합니다', () => {
    render(<TodoWidget />)
    expect(screen.getByText('할 일이 없습니다.')).toBeInTheDocument()
  })
})

