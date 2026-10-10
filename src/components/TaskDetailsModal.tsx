import React from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Paperclip,
  Repeat,
  CheckCircle,
  CornerDownRight,
  FolderTree,
  Edit2,
  Trash2,
  PlusCircle,
} from 'lucide-react';
import { Task } from '../types/task';

interface TaskDetailsModalProps {
  task: Task | null;
  allTasks: Task[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onAddSubtask: (task: Task) => void;
  onAdjustParent: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggleCompletion: (taskId: string) => void;
  onDrillDown: (task: Task) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  allTasks,
  isOpen,
  onClose,
  onEdit,
  onAddSubtask,
  onAdjustParent,
  onDelete,
  onToggleCompletion,
  onDrillDown,
}) => {
  if (!isOpen || !task) return null;

  const parentTask = task.parentId ? allTasks.find((t) => t.id === task.parentId) : null;
  const subtasks = allTasks.filter((t) => t.parentId === task.id);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-entrance">
      <div className="bg-[#1a1b22] border border-[#292931] rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#292931]">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                task.isCompleted ? 'bg-[#00f5a0]' : 'bg-[#5a45ff]'
              }`}
            />
            <h3 className="text-base font-semibold text-white">Task Details</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#918ea2] hover:text-white p-1 rounded-lg transition-colors active:scale-90"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title & Parent */}
        <div>
          {parentTask && (
            <div className="flex items-center gap-1.5 text-xs text-[#c5c0ff] mb-1">
              <CornerDownRight className="w-3.5 h-3.5" />
              <span>Subtask of:</span>
              <strong className="text-white hover:underline cursor-pointer" onClick={() => onDrillDown(parentTask)}>
                {parentTask.title}
              </strong>
            </div>
          )}
          <h2 className="text-lg font-bold text-white">{task.title}</h2>
          {task.notes && (
            <p className="text-xs text-[#c8c4d9] mt-2 whitespace-pre-wrap bg-[#12131a] p-3 rounded-xl border border-[#292931]">
              {task.notes}
            </p>
          )}
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[#12131a] border border-[#292931] p-2.5 rounded-xl flex items-center gap-2">
            <span className="text-[#918ea2]">Priority:</span>
            <span className="font-semibold text-white">{task.priority}</span>
          </div>

          <div className="bg-[#12131a] border border-[#292931] p-2.5 rounded-xl flex items-center gap-2">
            <span className="text-[#918ea2]">Section:</span>
            <span className="font-semibold text-white">{task.section}</span>
          </div>

          <div className="bg-[#12131a] border border-[#292931] p-2.5 rounded-xl flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#5a45ff]" />
            <span className="text-[#918ea2]">Due:</span>
            <span className="text-white">{task.dueDate || 'Today'}</span>
          </div>

          {task.dueTime && (
            <div className="bg-[#12131a] border border-[#292931] p-2.5 rounded-xl flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#5a45ff]" />
              <span className="text-[#918ea2]">Time:</span>
              <span className="text-white">{task.dueTime}</span>
            </div>
          )}

          {task.location && (
            <div className="bg-[#12131a] border border-[#292931] p-2.5 rounded-xl flex items-center gap-2 col-span-2">
              <MapPin className="w-3.5 h-3.5 text-[#67e8f9]" />
              <span className="text-[#918ea2]">Location:</span>
              <span className="text-white">{task.location}</span>
            </div>
          )}

          {task.repeatType && (
            <div className="bg-[#12131a] border border-[#292931] p-2.5 rounded-xl flex items-center gap-2 col-span-2">
              <Repeat className="w-3.5 h-3.5 text-[#00f5a0]" />
              <span className="text-[#918ea2]">Repeats:</span>
              <span className="text-white">{task.repeatType}</span>
            </div>
          )}

          {task.attachmentName && (
            <div className="bg-[#12131a] border border-[#292931] p-2.5 rounded-xl flex items-center gap-2 col-span-2">
              <Paperclip className="w-3.5 h-3.5 text-[#ffb77d]" />
              <span className="text-[#918ea2]">Attachment:</span>
              <span className="text-white truncate">{task.attachmentName}</span>
            </div>
          )}
        </div>

        {/* Subtasks Section */}
        <div className="pt-2 border-t border-[#292931]">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <CornerDownRight className="w-4 h-4 text-[#5a45ff]" />
              Subtasks ({subtasks.filter((s) => s.isCompleted).length}/{subtasks.length})
            </h4>
            <button
              onClick={() => {
                onClose();
                onAddSubtask(task);
              }}
              className="text-xs text-[#c5c0ff] hover:text-white flex items-center gap-1 hover:underline"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add Subtask
            </button>
          </div>

          {subtasks.length > 0 ? (
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#12131a] border border-[#292931] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleCompletion(st.id)}
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        st.isCompleted
                          ? 'bg-[#00f5a0] border-transparent text-[#003825]'
                          : 'border-[#474556]'
                      }`}
                    >
                      {st.isCompleted && <CheckCircle className="w-3 h-3" />}
                    </button>
                    <span className={st.isCompleted ? 'line-through text-[#918ea2]' : 'text-white'}>
                      {st.title}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onDrillDown(st);
                    }}
                    className="text-[#918ea2] hover:text-white text-[11px]"
                  >
                    View &rarr;
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#918ea2] italic py-1">No subtasks yet.</p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#292931]">
          <button
            onClick={() => {
              onClose();
              onDelete(task);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#ffb4ab] hover:bg-[#93000a]/30 transition-colors flex items-center gap-1.5 active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onAdjustParent(task);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#c8c4d9] hover:bg-[#292931] transition-colors flex items-center gap-1.5 active:scale-95"
            >
              <FolderTree className="w-3.5 h-3.5" />
              Adjust Parent
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#5a45ff] hover:bg-[#6e5aff] text-white transition-all shadow-md shadow-[#5a45ff]/25 flex items-center gap-1.5 active:scale-95"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
