"use client";

import { Download, RotateCcw, FileText, X, Loader2 } from "lucide-react";

interface ActionButtonsProps {
  onRetake: () => void;
  onSave: () => void;
  onScanAnother: () => void;
  onFinishAndClose: () => void;
  isSaving?: boolean;
}

export default function ActionButtons({
  onRetake,
  onSave,
  onScanAnother,
  onFinishAndClose,
  isSaving = false,
}: ActionButtonsProps) {
  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Primary Actions */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={onRetake}
          className="group flex items-center justify-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl border border-gray-200 transition-all duration-300 transform hover:scale-105 active:scale-95"
        >
          <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
          <span className="font-medium">Retake</span>
        </button>

        <button
          onClick={onSave}
          disabled={isSaving}
          className="group flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-medium">Saving...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform duration-200" />
              <span className="font-medium">Save</span>
            </>
          )}
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={onScanAnother}
          className="group flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
        >
          <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="font-medium text-sm">Scan Another</span>
        </button>

        <button
          onClick={onFinishAndClose}
          className="group flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
        >
          <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
          <span className="font-medium text-sm">Finish & Close</span>
        </button>
      </div>

      {/* Helper Text */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Document will be saved as JPG and PDF formats
        </p>
      </div>
    </div>
  );
}
