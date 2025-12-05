/**
 * ColorPicker 컴포넌트
 * 위젯 배경색을 선택할 수 있는 색상 팔레트
 */

interface ColorPickerProps {
  value?: string
  onChange: (color: string) => void
  label?: string
}

const PRESET_COLORS = [
  { name: '기본', value: '', light: '#ffffff', dark: '#1f2937' },
  { name: '흰색', value: '#ffffff', light: '#ffffff', dark: '#ffffff' },
  { name: '연한 파랑', value: '#dbeafe', light: '#dbeafe', dark: '#1e3a8a' },
  { name: '연한 초록', value: '#d1fae5', light: '#d1fae5', dark: '#065f46' },
  { name: '연한 노랑', value: '#fef3c7', light: '#fef3c7', dark: '#78350f' },
  { name: '연한 분홍', value: '#fce7f3', light: '#fce7f3', dark: '#831843' },
  { name: '연한 보라', value: '#e9d5ff', light: '#e9d5ff', dark: '#581c87' },
  { name: '연한 주황', value: '#fed7aa', light: '#fed7aa', dark: '#7c2d12' },
  { name: '연한 회색', value: '#f3f4f6', light: '#f3f4f6', dark: '#374151' },
]

const ColorPicker = ({ value, onChange, label = '배경색' }: ColorPickerProps) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((color) => {
          const isSelected = value === color.value
          return (
            <button
              key={color.value || 'default'}
              type="button"
              onClick={() => onChange(color.value)}
              className={`w-10 h-10 rounded-md border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-300 scale-110'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              style={{
                backgroundColor: color.value || (window.matchMedia('(prefers-color-scheme: dark)').matches ? color.dark : color.light),
              }}
              aria-label={`${color.name} 색상 선택${isSelected ? ' (선택됨)' : ''}`}
              title={color.name}
            >
              {isSelected && (
                <span className="text-white text-xs font-bold drop-shadow-lg">✓</span>
              )}
            </button>
          )
        })}
        {/* 커스텀 색상 입력 */}
        <div className="relative">
          <input
            type="color"
            value={value && value !== '' ? value : '#ffffff'}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded-md border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
            aria-label="커스텀 색상 선택"
          />
        </div>
        {/* 색상 초기화 */}
        {value && value !== '' && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="w-10 h-10 rounded-md border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 flex items-center justify-center text-gray-600 dark:text-gray-400"
            aria-label="기본 색상으로 초기화"
            title="기본 색상"
          >
            <span className="text-xs">↺</span>
          </button>
        )}
      </div>
      {value && value !== '' && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          선택된 색상: <span className="font-mono">{value}</span>
        </p>
      )}
    </div>
  )
}

export default ColorPicker

