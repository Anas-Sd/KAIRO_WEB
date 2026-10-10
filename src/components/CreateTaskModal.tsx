import React, { useState, useEffect } from 'react';
import { X, PlusCircle, CornerDownRight } from 'lucide-react';
import { Task, Priority, TaskSection } from '../types/task';

interface CreateTaskModalProps {
  isOpen: boolean;
  subtaskParent?: Task | null;
  defaultSection?: TaskSection;
  onClose: () => void;
  onCreate: (taskData: Partial<Task>) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  subtaskParent,
  defaultSection = 'TODAY',
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [section, setSection] = useState<TaskSection>(defaultSection);
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('Today');
  const [dueTime, setDueTime] = useState('');
  const [location, setLocation] = useState('');
  const [repeatType, setRepeatType] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setNotes('');
      setSection(defaultSection);
      setPriority('MEDIUM');
      setDueDate(
        defaultSection === 'TODAY'
          ? 'Today'
          : defaultSection === 'UPCOMING'
          ? 'Tomorrow'
          : 'Yesterday'
      );
      setDueTime('');
      setLocation('');
      setRepeatType('');
    }
  }, [isOpen, defaultSection]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreate({
      title: title.trim(),
      notes: notes.trim() || null,
      section,
      priority,
      dueDate: dueDate.trim() || 'Today',
      dueTime: dueTime.trim() || null,
      location: location.trim() || null,
      repeatType: repeatType || null,
      parentId: subtaskParent ? subtaskParent.id : null,
      dueDateMillis: Date.now(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-entrance">
      <div className="bg-[#1a1b22] border border-[#292931] rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#292931]">
          <div className="flex flex-col">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#5a45ff]" />
              {subtaskParent ? 'Add Subtask' : 'Create New Task'}
            </h3>
            {subtaskParent && (
              <span className="text-xs text-[#c5c0ff] flex items-center gap-1 mt-0.5">
                <CornerDownRight className="w-3.5 h-3.5" />
                Under: <strong className="text-white">{subtaskParent.title}</strong>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#918ea2] hover:text-white p-1 rounded-lg transition-colors active:scale-90"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-[#918ea2] mb-1">
              Task Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Finalize presentation slides..."
              className="w-full bg-[#12131a] border border-[#292931] rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-[#918ea2] focus:border-[#5a45ff] focus:ring-1 focus:ring-[#5a45ff] outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#918ea2] mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add extra context or instructions..."
              className="w-full bg-[#12131a] border border-[#292931] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-[#918ea2] focus:border-[#5a45ff] focus:ring-1 focus:ring-[#5a45ff] outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#918ea2] mb-1">Section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value as TaskSection)}
                className="w-full bg-[#12131a] border border-[#292931] rounded-xl px-3 py-2 text-xs text-white focus:border-[#5a45ff] focus:ring-1 focus:ring-[#5a45ff] outline-none transition-all"
              >
                <option value="TODAY">Today</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#918ea2] mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-[#12131a] border border-[#292931] rounded-xl px-3 py-2 text-xs text-white focus:border-[#5a45ff] focus:ring-1 focus:ring-[#5a45ff] outline-none transition-all"
              >
                <option value="LOW">Low (Green)</option>
                <option value="MEDIUM">Medium (Blue)</option>
                <option value="HIGH">High (Red)</option>
                <option value="URGENT">Urgent (Red)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#918ea2] mb-1">Due Date</label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="e.g. Today, Tomorrow, Oct 25"
                className="w-full bg-[#12131a] border border-[#292931] rounded-xl px-3 py-2 text-xs text-white focus:border-[#5a45ff] focus:ring-1 focus:ring-[#5a45ff] outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#918ea2] mb-1">Due Time</label>
              <input
                type="text"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                placeholder="e.g. 09:30 AM or 18:00"
                className="w-full bg-[#12131a] border border-[#292931] rounded-xl px-3 py-2 text-xs text-white focus:border-[#5a45ff] focus:ring-1 focus:ring-[#5a45ff] outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#918ea2] mb-1">
                Location (Optional)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Office, Home, Gym"
                className="w-full bg-[#12131a] border border-[#292931] rounded-xl px-3 py-2 text-xs text-white focus:border-[#5a45ff] focus:ring-1 focus:ring-[#5a45ff] outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#918ea2] mb-1">Repeat (Optional)</label>
              <select
                value={repeatType}
                onChange={(e) => setRepeatType(e.target.value)}
                className="w-full bg-[#12131a] border border-[#292931] rounded-xl px-3 py-2 text-xs text-white focus:border-[#5a45ff] focus:ring-1 focus:ring-[#5a45ff] outline-none transition-all"
              >
                <option value="">None</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKDAYS">Weekdays</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#292931]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#c8c4d9] hover:bg-[#292931] transition-colors active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#5a45ff] hover:bg-[#6e5aff] text-white transition-all shadow-md shadow-[#5a45ff]/25 active:scale-95"
            >
              {subtaskParent ? 'Add Subtask' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
