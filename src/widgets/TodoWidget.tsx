import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTodoStore } from '../stores/todoStore'
import Widget from '../components/Widget'

const TodoWidget = () => {
  const { todos, addTodo, toggleTodo, deleteTodo } = useTodoStore()
  const [newTodoText, setNewTodoText] = useState('')

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

  const incompleteTodos = todos.filter((todo) => !todo.completed)
  const completedTodos = todos.filter((todo) => todo.completed)

  return (
    <Widget title="오늘 할 일">
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
  )
}

export default TodoWidget

