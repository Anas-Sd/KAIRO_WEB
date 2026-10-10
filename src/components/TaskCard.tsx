import React, { useState } from 'react';
import {
  Check,
  Calendar,
  Clock,
  MapPin,
  Paperclip,
  Repeat,
  AlertTriangle,
  MoreVertical,
  CornerDownRight,
  GripVertical,
  Edit2,
  FolderTree,
  Trash2,
  Info,
  PlusCircle,
} from 'lucide-react';
import { Task } from '../types/task';

interface TaskCardProps {
  task: Task;
  allTasks: Task[];
  onToggleCompletion: (taskId: string) => void;
  onDrillDown: (task: Task) => void;
  onEdit: (task: Task) => void;
  onShowDetails: (task: Task) => void;
  onAddSubtask: (task: Task) => void;
  onAdjustParent: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  allTasks,
  onToggleCompletion,
  onDrillDown,
  onEdit,
  onShowDetails,
  onAddSubtask,
  onAdjustParent,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  // Subtask statistics
  const subtasks = allTasks.filter((t) => t.parentId === task.id);
  const hasSubtasks = subtasks.length > 0;
  const completedSubtasksCount = subtasks.filter((t) => t.isCompleted).length;

  const isOverdue = task.section === 'OVERDUE' && !task.isCompleted;

  const getPriorityStyle = () => {
    switch (task.priority) {
      case 'URGENT':
      case 'HIGH':
        return 'bg-[#dc2626] text-white';
      case 'MEDIUM':
        return 'bg-[#2563eb] text-white';
      case 'LOW':
      default:
        return 'bg-[#16a34a] text-white';
    }
  };

  return (
    <div
      className={`task-card group relative flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#1e1f26] border ${
        isOverdue ? 'border-[#ffb4ab]/30' : 'border-[#292931]'
      } hover:border-[#5a45ff]/40 shadow-sm`}
    >
      {/* Left Area: Drag, Checkbox & Main Content */}
      <div className="flex items-start md:items-center gap-3 min-w-0 flex-1">
        {/* Grip Drag Handle */}
        <div className="p-0.5 text-[#918ea2] opacity-40 group-hover:opacity-100 transition-opacity cursor-grab hidden sm:flex items-center">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Checkbox with bounce */}
        <button
          type="button"
          onClick={() => onToggleCompletion(task.id)}
          className={`task-checkbox w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors mt-0.5 md:mt-0 ${
            task.isCompleted
              ? 'checked bg-[#00f5a0] text-[#003825]'
              : 'bg-[#12131a] border-2 border-[#474556] hover:border-[#5a45ff]'
          }`}
          title={task.isCompleted ? 'Mark Active' : 'Mark Completed'}
        >
          {task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3] text-[#003825]" />}
        </button>

        {/* Title, Notes & Badges */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              onClick={() => onShowDetails(task)}
              className={`task-title text-sm font-medium text-white truncate cursor-pointer hover:text-[#c5c0ff] transition-colors ${
                task.isCompleted ? 'is-completed' : ''
              }`}
            >
              {task.title}
            </span>

            {/* Subtask drill-down badge if task has children */}
            {hasSubtasks && (
              <button
                type="button"
                onClick={() => onDrillDown(task)}
                className="flex items-center gap-1 bg-[#5a45ff]/15 hover:bg-[#5a45ff]/30 text-[#c5c0ff] border border-[#5a45ff]/30 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors"
                title="Click to view subtasks"
              >
                <CornerDownRight className="w-3 h-3 text-[#5a45ff]" />
                <span>
                  {completedSubtasksCount} of {subtasks.length} subtasks
                </span>
              </button>
            )}
          </div>

          {/* Task notes if present */}
          {task.notes && (
            <p className="text-xs text-[#918ea2] mt-0.5 line-clamp-1">{task.notes}</p>
          )}

          {/* Android Capsule Badges */}
          <div className="flex items-center gap-1.5 text-xs mt-1.5 flex-wrap">
            {/* Priority Capsule */}
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${getPriorityStyle()}`}>
              {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
            </span>

            {/* Due Date */}
            {task.dueDate && (
              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#292931] ${
                  isOverdue ? 'text-[#ffb4ab]' : 'text-[#c8c4d9]'
                }`}
              >
                {isOverdue ? (
                  <AlertTriangle className="w-3 h-3 text-[#ffb4ab]" />
                ) : (
                  <Calendar className="w-3 h-3 text-[#5a45ff]" />
                )}
                {task.dueDate}
              </span>
            )}

            {/* Due Time */}
            {task.dueTime && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#292931] text-[#c8c4d9]">
                <Clock className="w-3 h-3 text-[#5a45ff]" />
                {task.dueTime}
              </span>
            )}

            {/* Location */}
            {task.location && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#0284c7]/20 border border-[#0284c7]/30 text-[#67e8f9]">
                <MapPin className="w-3 h-3" />
                {task.location}
              </span>
            )}

            {/* Repeat Type */}
            {task.repeatType && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#114a38] text-[#a7f8d4]">
                <Repeat className="w-3 h-3 text-[#00f5a0]" />
                {task.repeatType.toLowerCase()}
              </span>
            )}

            {/* Attachment */}
            {task.attachmentName && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#ffb77d]/10 text-[#ffb77d] max-w-[140px] truncate">
                <Paperclip className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{task.attachmentName}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Area: Action Buttons & Menu */}
      <div className="flex items-center gap-1 self-end md:self-center flex-shrink-0 relative">
        <button
          type="button"
          onClick={() => onShowDetails(task)}
          className="p-1.5 rounded-lg hover:bg-[#292931] text-[#918ea2] hover:text-white transition-colors"
          title="Task details"
        >
          <Info className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onEdit(task)}
          className="p-1.5 rounded-lg hover:bg-[#292931] text-[#918ea2] hover:text-white transition-colors"
          title="Edit task"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 rounded-lg hover:bg-[#292931] text-[#918ea2] hover:text-white transition-colors"
          title="More options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-8 z-50 w-48 bg-[#1a1b22] border border-[#292931] rounded-xl p-1.5 shadow-2xl flex flex-col gap-0.5 animate-entrance">
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onAddSubtask(task);
                }}
                className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[#292931] text-white flex items-center gap-2 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#5a45ff]" />
                <span>Add Subtask</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onDrillDown(task);
                }}
                className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[#292931] text-[#c8c4d9] flex items-center gap-2 transition-colors"
              >
                <CornerDownRight className="w-3.5 h-3.5 text-[#00f5a0]" />
                <span>View Subtasks</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onAdjustParent(task);
                }}
                className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[#292931] text-[#c8c4d9] flex items-center gap-2 transition-colors"
              >
                <FolderTree className="w-3.5 h-3.5 text-[#ffb77d]" />
                <span>Adjust Parent</span>
              </button>

              <div className="h-px bg-[#292931] my-1" />

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onDelete(task);
                }}
                className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[#93000a]/40 text-[#ffb4ab] flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#ffb4ab]" />
                <span>Delete Task</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
