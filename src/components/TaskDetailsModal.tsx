import React from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Paperclip,
  Repeat,
  Music,
  CheckCircle,
  CornerDownRight,
  FolderTree,
  Edit2,
  Trash2,
  PlusCircle,
  ExternalLink,
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-entrance">
      <div className="bg-[#1a1b22] border border-[#292931] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
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

        {/* Parent breadcrumb */}
        {parentTask && (
          <div className="flex items-center gap-1.5 text-xs text-[#c5c0ff] bg-[#5a45ff]/10 border border-[#5a45ff]/20 px-3 py-1.5 rounded-xl">
            <CornerDownRight className="w-3.5 h-3.5 text-[#5a45ff]" />
            <span>Subtask of:</span>
            <strong
              className="text-white hover:underline cursor-pointer font-semibold"
              onClick={() => onDrillDown(parentTask)}
            >
              {parentTask.title}
            </strong>
          </div>
        )}

        {/* Title & Notes */}
        <div>
          <h2
            className={`text-lg font-bold text-white break-words ${
              task.isCompleted ? 'line-through text-[#918ea2]' : ''
            }`}
          >
            {task.title}
          </h2>

          {task.notes && (
            <p className="text-xs text-[#c8c4d9] mt-2.5 whitespace-pre-wrap bg-[#12131a] p-3.5 rounded-xl border border-[#292931]">
              {task.notes}
            </p>
          )}
        </div>

        {/* Core Metadata Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {/* Priority */}
          <div className="bg-[#12131a] border border-[#292931] p-2.5 rounded-xl flex flex-col gap-0.5">
            <span className="text-[10px] text-[#918ea2] uppercase tracking-wider">Priority</span>
            <span className="font-semibold text-white">{task.priority}</span>
          </div>

          {/* Section */}
          <div className="bg-[#12131a] border border-[#292931] p-2.5 rounded-xl flex flex-col gap-0.5">
            <span className="text-[10px] text-[#918ea2] uppercase tracking-wider">Section</span>
            <span className="font-semibold text-white">{task.section}</span>
          </div>

          {/* Status */}
          <div className="bg-[#12131a] border border-[#292931] p-2.5 rounded-xl flex flex-col gap-0.5">
            <span className="text-[10px] text-[#918ea2] uppercase tracking-wider">Status</span>
            <span className={`font-semibold ${task.isCompleted ? 'text-[#00f5a0]' : 'text-[#c5c0ff]'}`}>
              {task.isCompleted ? 'Completed' : 'Active'}
            </span>
          </div>

          {/* Due Date */}
          <div className="bg-[#12131a] border border-[#292931] p-2.5 rounded-xl flex flex-col gap-0.5">
            <span className="text-[10px] text-[#918ea2] uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#5a45ff]" />
              Due Date
            </span>
            <span className="font-semibold text-white">{task.dueDate || 'None'}</span>
          </div>

          {/* Due Time */}
          <div className="bg-[#12131a] border border-[#292931] p-2.5 rounded-xl flex flex-col gap-0.5">
            <span className="text-[10px] text-[#918ea2] uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#5a45ff]" />
              Due Time
            </span>
            <span className="font-semibold text-white">{task.dueTime || 'All Day'}</span>
          </div>

          {/* Alarm Tone */}
          <div className="bg-[#12131a] border border-[#292931] p-2.5 rounded-xl flex flex-col gap-0.5">
            <span className="text-[10px] text-[#918ea2] uppercase tracking-wider flex items-center gap-1">
              <Music className="w-3 h-3 text-[#5a45ff]" />
              Tone
            </span>
            <span className="font-semibold text-white truncate">
              {task.alarmToneTitle || 'Default'}
            </span>
          </div>
        </div>

        {/* Repeat Details (if enabled) */}
        {task.repeatType && (
          <div className="bg-[#12131a] border border-[#292931] p-3 rounded-xl flex items-center gap-2.5 text-xs">
            <Repeat className="w-4 h-4 text-[#00f5a0] flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-[#918ea2] text-[11px]">Repeat Schedule</span>
              <span className="text-white font-medium">
                {task.repeatType}
                {task.repeatDays ? ` (${task.repeatDays})` : ''}
                {task.repeatDates ? ` (Day ${task.repeatDates})` : ''}
              </span>
            </div>
          </div>
        )}

        {/* Location & Geofence (if enabled) */}
        {task.location && (
          <div className="bg-[#12131a] border border-[#292931] p-3 rounded-xl flex items-start gap-2.5 text-xs">
            <MapPin className="w-4 h-4 text-[#0284c7] flex-shrink-0 mt-0.5" />
            <div className="flex flex-col flex-1">
              <span className="text-[#918ea2] text-[11px]">Location & Geofence</span>
              <span className="text-white font-medium">{task.location}</span>
              {task.latitude && task.longitude && (
                <span className="text-[#67e8f9] text-[11px] mt-0.5">
                  GPS: {task.latitude.toFixed(4)}, {task.longitude.toFixed(4)} (Radius: {task.locationRadius || 500}m)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Attachment (if present) */}
        {task.attachmentName && (
          <div className="bg-[#12131a] border border-[#292931] p-3 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <Paperclip className="w-4 h-4 text-[#ffb77d] flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[#918ea2] text-[11px]">Attachment</span>
                <span className="text-white font-medium truncate">{task.attachmentName}</span>
              </div>
            </div>

            {task.attachmentUri && (
              <a
                href={task.attachmentUri}
                download={task.attachmentName}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg bg-[#292931] hover:bg-[#33343c] text-white flex items-center gap-1 text-[11px]"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open</span>
              </a>
            )}
          </div>
        )}

        {/* Subtasks Section */}
        {subtasks.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#c8c4d9]">
                Subtasks ({subtasks.filter((t) => t.isCompleted).length}/{subtasks.length})
              </span>
              <button
                type="button"
                onClick={() => onDrillDown(task)}
                className="text-xs text-[#5a45ff] hover:underline"
              >
                View in Workspace →
              </button>
            </div>
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-[#12131a] border border-[#292931] text-xs text-white"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      st.isCompleted ? 'bg-[#00f5a0]' : 'bg-[#5a45ff]'
                    }`}
                  />
                  <span className={`truncate ${st.isCompleted ? 'line-through text-[#918ea2]' : ''}`}>
                    {st.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#292931] mt-1 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleCompletion(task.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
                task.isCompleted
                  ? 'bg-[#12131a] border border-[#292931] text-white hover:bg-[#292931]'
                  : 'bg-[#00f5a0] text-[#003825] hover:bg-[#00d68b]'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{task.isCompleted ? 'Mark Active' : 'Mark Done'}</span>
            </button>

            <button
              type="button"
              onClick={() => onAddSubtask(task)}
              className="px-3 py-1.5 rounded-xl bg-[#292931] hover:bg-[#33343c] text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#5a45ff]" />
              <span>Add Subtask</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onAdjustParent(task)}
              className="p-2 rounded-xl bg-[#292931] hover:bg-[#33343c] text-white transition-colors"
              title="Move Task / Adjust Parent"
            >
              <FolderTree className="w-4 h-4 text-[#ffb77d]" />
            </button>

            <button
              type="button"
              onClick={() => onEdit(task)}
              className="p-2 rounded-xl bg-[#292931] hover:bg-[#33343c] text-white transition-colors"
              title="Edit Task"
            >
              <Edit2 className="w-4 h-4 text-[#5a45ff]" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(task)}
              className="p-2 rounded-xl bg-[#93000a]/20 hover:bg-[#93000a]/40 text-[#ffb4ab] transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
