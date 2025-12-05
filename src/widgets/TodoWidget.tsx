import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTodoStore } from '../stores/todoStore'
import { useDashboardStore } from '../stores/dashboardStore'
import Widget from '../components/Widget'
import Modal from '../components/Modal'
import ColorPicker from '../components/ColorPicker'

const TodoWidget = () => {
  const { todos, addTodo, toggleTodo, deleteTodo } = useTodoStore()
  const { widgetBackgroundColors, updateWidgetBackgroundColor } = useDashboardStore()
  const backgroundColor = widgetBackgroundColors['todo']
  const [newTodoText, setNewTodoText] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formBackgroundColor, setFormBackgroundColor] = useState<string>(backgroundColor || '')

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      addTodo(newTodoText.trim())
      setNewTodoText('')
      toast.success('할 일이 추가되었습니다')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTodo()
    }
  }

  useEffect(() => {
    if (isModalOpen) {
      setFormBackgroundColor(backgroundColor || '')
    }
  }, [isModalOpen, backgroundColor])

  const handleSettingsClick = () => {
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const handleSave = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    updateWidgetBackgroundColor('todo', formBackgroundColor)
    toast.success('배경색이 저장되었습니다')
    handleModalClose()
  }

  const handleCancel = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    handleModalClose()
  }

  const incompleteTodos = todos.filter((todo) => !todo.completed)
  const completedTodos = todos.filter((todo) => todo.completed)

  return (
    <>
      <Widget title="오늘 할 일" onSettingsClick={handleSettingsClick} backgroundColor={backgroundColor}>
      <div className="space-y-3">
        {/* 할 일 추가 입력 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="새 할 일 추가..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            aria-label="할 일 입력"
          />
          <button
            onClick={handleAddTodo}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="할 일 추가"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* 미완료 할 일 목록 */}
        {incompleteTodos.length > 0 && (
          <div className="space-y-2">
            {incompleteTodos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => {
                    const wasCompleted = todo.completed
                    toggleTodo(todo.id)
                    if (!wasCompleted) {
                      toast.success('할 일을 완료했습니다! 🎉')
                    }
                  }}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  aria-label={`${todo.text} 완료`}
                />
                <span className="flex-1 text-gray-900 dark:text-white">{todo.text}</span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 rounded transition-colors"
                  aria-label={`${todo.text} 삭제`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 완료된 할 일 목록 */}
        {completedTodos.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">완료됨</p>
            {completedTodos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  aria-label={`${todo.text} 완료 취소`}
                />
                <span className="flex-1 text-gray-500 dark:text-gray-400 line-through">
                  {todo.text}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 rounded transition-colors"
                  aria-label={`${todo.text} 삭제`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 빈 상태 */}
        {todos.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>할 일이 없습니다.</p>
            <p className="text-sm mt-1">위 입력창에 할 일을 추가해보세요.</p>
          </div>
        )}
      </div>
      </Widget>

      {/* 설정 모달 */}
      <Modal isOpen={isModalOpen} onClose={handleModalClose} title="할 일 위젯 설정">
        <div className="space-y-4">
          <ColorPicker
            value={formBackgroundColor}
            onChange={setFormBackgroundColor}
            label="위젯 배경색"
          />

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              type="button"
            >
              저장
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              type="button"
            >
              취소
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default TodoWidget

