/**
 * LayoutManager 컴포넌트
 * 다중 레이아웃 저장, 전환, 삭제 기능을 제공하는 UI 컴포넌트
 */

import { useState } from 'react'
import { Save, Trash2, Edit2, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from './Modal'
import { useDashboardStore } from '../stores/dashboardStore'

const LayoutManager = () => {
  const {
    savedLayouts,
    currentLayoutName,
    saveLayout,
    loadLayout,
    deleteLayout,
    renameLayout,
  } = useDashboardStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newLayoutName, setNewLayoutName] = useState('')
  const [editingName, setEditingName] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleSaveLayout = () => {
    if (!newLayoutName.trim()) {
      toast.error('레이아웃 이름을 입력해주세요')
      return
    }

    if (savedLayouts[newLayoutName.trim()]) {
      toast.error('이미 존재하는 레이아웃 이름입니다')
      return
    }

    saveLayout(newLayoutName.trim())
    toast.success(`'${newLayoutName.trim()}' 레이아웃이 저장되었습니다`)
    setNewLayoutName('')
    setIsModalOpen(false)
  }

  const handleLoadLayout = (name: string) => {
    loadLayout(name)
    toast.success(`'${name}' 레이아웃을 불러왔습니다`)
    setIsModalOpen(false)
  }

  const handleDeleteLayout = (name: string) => {
    if (Object.keys(savedLayouts).length <= 1) {
      toast.error('최소 하나의 레이아웃은 유지해야 합니다')
      return
    }

    if (window.confirm(`'${name}' 레이아웃을 삭제하시겠습니까?`)) {
      deleteLayout(name)
      toast.success(`'${name}' 레이아웃이 삭제되었습니다`)
    }
  }

  const handleStartRename = (name: string) => {
    setEditingName(name)
    setEditValue(name)
  }

  const handleConfirmRename = () => {
    if (!editingName || !editValue.trim()) return

    if (editValue.trim() === editingName) {
      setEditingName(null)
      return
    }

    if (savedLayouts[editValue.trim()]) {
      toast.error('이미 존재하는 레이아웃 이름입니다')
      return
    }

    renameLayout(editingName, editValue.trim())
    toast.success(`레이아웃 이름이 변경되었습니다`)
    setEditingName(null)
    setEditValue('')
  }

  const handleCancelRename = () => {
    setEditingName(null)
    setEditValue('')
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center gap-2"
        aria-label="레이아웃 관리"
      >
        <Save className="w-4 h-4" aria-hidden="true" />
        레이아웃 관리
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="레이아웃 관리">
        <div className="space-y-4">
          {/* 현재 레이아웃 표시 */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">현재 레이아웃</p>
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {currentLayoutName}
            </p>
          </div>

          {/* 새 레이아웃 저장 */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <label
              htmlFor="new-layout-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              새 레이아웃 저장
            </label>
            <div className="flex gap-2">
              <input
                id="new-layout-name"
                type="text"
                value={newLayoutName}
                onChange={(e) => setNewLayoutName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveLayout()
                  }
                }}
                placeholder="레이아웃 이름 입력..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                aria-label="새 레이아웃 이름"
              />
              <button
                onClick={handleSaveLayout}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" aria-hidden="true" />
                저장
              </button>
            </div>
          </div>

          {/* 저장된 레이아웃 목록 */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              저장된 레이아웃 ({Object.keys(savedLayouts).length}개)
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.keys(savedLayouts).map((name) => (
                <div
                  key={name}
                  className={`flex items-center gap-2 p-3 rounded-lg border ${
                    name === currentLayoutName
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {editingName === name ? (
                    <>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleConfirmRename()
                          } else if (e.key === 'Escape') {
                            handleCancelRename()
                          }
                        }}
                        className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        autoFocus
                      />
                      <button
                        onClick={handleConfirmRename}
                        className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                        aria-label="이름 변경 확인"
                      >
                        <Check className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        aria-label="이름 변경 취소"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleLoadLayout(name)}
                        className={`flex-1 text-left px-2 py-1 rounded transition-colors ${
                          name === currentLayoutName
                            ? 'font-semibold text-blue-600 dark:text-blue-400'
                            : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {name}
                        {name === currentLayoutName && (
                          <span className="ml-2 text-xs text-blue-500">(현재)</span>
                        )}
                      </button>
                      <button
                        onClick={() => handleStartRename(name)}
                        className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        aria-label={`${name} 이름 변경`}
                      >
                        <Edit2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                      {Object.keys(savedLayouts).length > 1 && (
                        <button
                          onClick={() => handleDeleteLayout(name)}
                          className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          aria-label={`${name} 삭제`}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default LayoutManager

