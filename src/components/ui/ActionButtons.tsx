'use client'

import { Download, RotateCcw } from 'lucide-react'

interface ActionButtonsProps {
  onRetake: () => void
  onSave: () => void
  onScanAnother: () => void
  onFinishAndClose: () => void
  isSaving?: boolean
}

export default function ActionButtons({
  onRetake,
  onSave,
  onScanAnother,
  onFinishAndClose,
  isSaving = false
}: ActionButtonsProps) {
  return (
    <>
      {/* Primary Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={onRetake}
          className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <RotateCcw size={16} />
          <span>Retake</span>
        </button>

        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <Download size={16} />
          <span>{isSaving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="flex space-x-3">
        <button
          onClick={onScanAnother}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          📄 Scan Another
        </button>

        <button
          onClick={onFinishAndClose}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          🚪 Finish & Close
        </button>
      </div>
    </>
  )
}