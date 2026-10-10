import React from 'react';
import { RotateCcw } from 'lucide-react';

interface UndoDoneBarProps {
  taskTitle: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export const UndoDoneBar: React.FC<UndoDoneBarProps> = ({
  taskTitle,
  onUndo,
  onDismiss,
}) => {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#1a1b22] border border-[#5a45ff]/50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-4 z-50 animate-entrance max-w-md w-full">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#c8c4d9] truncate">
          Completed <strong className="text-white font-medium">"{taskTitle}"</strong>
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onUndo}
          className="px-3 py-1.5 rounded-xl bg-[#5a45ff] hover:bg-[#6e5aff] text-white text-xs font-semibold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Undo</span>
        </button>

        <button
          onClick={onDismiss}
          className="text-xs text-[#918ea2] hover:text-white px-2 py-1 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
