import TodoWidget from './widgets/TodoWidget'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4 max-w-6xl">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            개발자 생산성 대시보드 (D-Prod)
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            모든 개발 활동을 한 곳에서 확인하세요
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="h-96">
            <TodoWidget />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

