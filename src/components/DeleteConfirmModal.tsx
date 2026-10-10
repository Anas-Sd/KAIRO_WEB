import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Task } from '../types/task';

interface DeleteConfirmModalProps {
  task: Task | null;
  allTasks: Task[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  task,
  allTasks,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !task) return null;

  const subtasksCount = allTasks.filter((t) => t.parentId === task.id).length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-entrance">
      <div className="bg-[#1a1b22] border border-[#292931] rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#292931]">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#ffb4ab]" />
            Delete Task
          </h3>
          <button
            onClick={onClose}
            className="text-[#918ea2] hover:text-white p-1 rounded-lg transition-colors active:scale-90"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#c8c4d9]">
          Are you sure you want to delete <strong className="text-white font-semibold">"{task.title}"</strong>?
        </p>

        {subtasksCount > 0 && (
          <div className="p-3 bg-[#93000a]/20 border border-[#ffb4ab]/30 rounded-xl text-xs text-[#ffdad6]">
            ⚠️ This task has <strong>{subtasksCount} subtask(s)</strong> which will also be deleted.
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#292931]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#c8c4d9] hover:bg-[#292931] transition-colors active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#93000a] hover:bg-[#b3141f] text-white transition-all shadow-md active:scale-95 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
