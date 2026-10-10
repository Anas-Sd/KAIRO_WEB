import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  CornerDownRight,
  Calendar,
  Clock,
  MapPin,
  Repeat,
  Music,
  Paperclip,
  Navigation,
  Trash2,
} from 'lucide-react';
import { Task, Priority, TaskSection } from '../types/task';

interface CreateTaskModalProps {
  isOpen: boolean;
  subtaskParent?: Task | null;
  allTasks?: Task[];
  defaultSection?: TaskSection;
  onClose: () => void;
  onCreate: (taskData: Partial<Task>) => void;
}

const TONE_OPTIONS = [
  { title: 'Default Alarm Tone', uri: 'default' },
  { title: 'Digital Bell', uri: 'digital_bell' },
  { title: 'Synthesizer Pulse', uri: 'synth_pulse' },
  { title: 'Radar Ping', uri: 'radar' },
  { title: 'Gentle Harp', uri: 'gentle_harp' },
  { title: 'Sunrise Glow', uri: 'sunrise' },
];

const WEEK_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  subtaskParent,
  allTasks = [],
  defaultSection = 'TODAY',
  onClose,
  onCreate,
}) => {
  // 1. Mandatory & Basic
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<Priority>('LOW');

  // 2. Date & Time
  const [dateType, setDateType] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [customDate, setCustomDate] = useState('');
  const [dueTime, setDueTime] = useState('');

  // 3. Parent / Subtask
  const [parentId, setParentId] = useState<string | null>(subtaskParent ? subtaskParent.id : null);

  // 4. Repeat
  const [repeatType, setRepeatType] = useState<string>('');
  const [selectedWeekDays, setSelectedWeekDays] = useState<string[]>([]);
  const [repeatDayOfMonth, setRepeatDayOfMonth] = useState<number>(1);

  // 5. Alarm Tone
  const [alarmToneTitle, setAlarmToneTitle] = useState('Default Alarm Tone');
  const [alarmToneUri, setAlarmToneUri] = useState('default');

  // 6. Location & Geofencing
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationRadius, setLocationRadius] = useState<number>(500);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // 7. Attachments
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentUri, setAttachmentUri] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setNotes('');
      setPriority('LOW');
      setDateType(defaultSection === 'TODAY' ? 'today' : defaultSection === 'UPCOMING' ? 'tomorrow' : 'today');
      
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      setCustomDate(`${yyyy}-${mm}-${dd}`);

      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      setDueTime(`${hh}:${min}`);

      setParentId(subtaskParent ? subtaskParent.id : null);
      setRepeatType('');
      setSelectedWeekDays([]);
      setRepeatDayOfMonth(now.getDate());
      setAlarmToneTitle('Default Alarm Tone');
      setAlarmToneUri('default');
      setLocationName('');
      setLatitude(null);
      setLongitude(null);
      setLocationRadius(500);
      setAttachmentName(null);
      setAttachmentUri(null);
    }
  }, [isOpen, defaultSection, subtaskParent]);

  if (!isOpen) return null;

  // Browser Geolocation Helper
  const handleFetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        if (!locationName) {
          setLocationName(`Current Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        }
        setIsGettingLocation(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsGettingLocation(false);
      },
      { timeout: 10000 }
    );
  };

  // File Upload Helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachmentName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentUri(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleToggleDay = (day: string) => {
    if (selectedWeekDays.includes(day)) {
      setSelectedWeekDays(selectedWeekDays.filter((d) => d !== day));
    } else {
      setSelectedWeekDays([...selectedWeekDays, day]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Compute Date representation and Millis
    let displayDate = 'Today';
    let targetMillis: number = Date.now();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateType === 'today') {
      displayDate = 'Today';
      targetMillis = today.getTime();
    } else if (dateType === 'tomorrow') {
      displayDate = 'Tomorrow';
      targetMillis = today.getTime() + 86400000;
    } else if (customDate) {
      const parts = customDate.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0, 0);
        targetMillis = d.getTime();
        displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    }

    // Dynamic Section
    const todayStart = today.getTime();
    const todayEnd = todayStart + 86400000;
    let computedSection: TaskSection = 'TODAY';
    if (displayDate.toLowerCase().includes('yesterday') || targetMillis < todayStart) {
      computedSection = 'OVERDUE';
    } else if (displayDate.toLowerCase().includes('today') || (targetMillis >= todayStart && targetMillis < todayEnd)) {
      computedSection = 'TODAY';
    } else {
      computedSection = 'UPCOMING';
    }

    onCreate({
      title: title.trim(),
      notes: notes.trim() || null,
      priority,
      dueDate: displayDate,
      dueDateMillis: targetMillis,
      dueTime: dueTime.trim() || null,
      section: computedSection,
      parentId: parentId || null,
      repeatType: repeatType || null,
      repeatDays: selectedWeekDays.length > 0 ? selectedWeekDays.join(',') : null,
      repeatDates: repeatType === 'MONTHLY' ? String(repeatDayOfMonth) : null,
      alarmToneTitle: alarmToneTitle || null,
      alarmToneUri: alarmToneUri || null,
      location: locationName.trim() || null,
      latitude,
      longitude,
      locationRadius,
      attachmentName: attachmentName || null,
      attachmentUri: attachmentUri || null,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-entrance">
      <div className="bg-[#1a1b22] border border-[#292931] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#292931]">
          <div className="flex flex-col">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#5a45ff]" />
              {subtaskParent ? 'Add Subtask' : 'Create Task'}
            </h3>
            {subtaskParent && (
              <span className="text-xs text-[#c5c0ff] flex items-center gap-1 mt-0.5">
                <CornerDownRight className="w-3.5 h-3.5 text-[#5a45ff]" />
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs">
          {/* 1. Title Input (Required) */}
          <div>
            <label className="block text-xs font-medium text-[#c8c4d9] mb-1">
              Task Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name of task"
              className="w-full bg-[#12131a] border border-[#292931] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-[#6b687c] focus:border-[#5a45ff] outline-none transition-all"
            />
          </div>

          {/* 2. Notes Input (Optional) */}
          <div>
            <label className="block text-xs font-medium text-[#c8c4d9] mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="w-full bg-[#12131a] border border-[#292931] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-[#6b687c] focus:border-[#5a45ff] outline-none transition-all resize-none"
            />
          </div>

          {/* 3. Priority Selector */}
          <div>
            <label className="block text-xs font-medium text-[#c8c4d9] mb-1.5">Priority</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'LOW', label: 'Low', color: 'bg-[#16a34a]' },
                { key: 'MEDIUM', label: 'Med', color: 'bg-[#5a45ff]' },
                { key: 'HIGH', label: 'High', color: 'bg-[#ffb77d] text-[#4d2600]' },
                { key: 'URGENT', label: 'Urgent', color: 'bg-[#dc2626]' },
              ].map((p) => {
                const isSelected = priority === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPriority(p.key as Priority)}
                    className={`py-2 px-2 rounded-xl text-center font-medium transition-all border flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'border-white/50 shadow-md scale-[1.02] text-white font-bold ' + p.color
                        : 'bg-[#12131a] border-[#292931] text-[#918ea2] hover:text-white'
                    }`}
                  >
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Due Date & Due Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#12131a] p-3 rounded-xl border border-[#292931]">
            <div>
              <label className="block text-xs font-medium text-[#c8c4d9] mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#5a45ff]" />
                Due Date
              </label>
              <div className="flex items-center gap-1.5 mb-2">
                <button
                  type="button"
                  onClick={() => setDateType('today')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    dateType === 'today'
                      ? 'bg-[#5a45ff] text-white'
                      : 'bg-[#1e1f26] text-[#918ea2] hover:text-white'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setDateType('tomorrow')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    dateType === 'tomorrow'
                      ? 'bg-[#5a45ff] text-white'
                      : 'bg-[#1e1f26] text-[#918ea2] hover:text-white'
                  }`}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setDateType('custom')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    dateType === 'custom'
                      ? 'bg-[#5a45ff] text-white'
                      : 'bg-[#1e1f26] text-[#918ea2] hover:text-white'
                  }`}
                >
                  Pick
                </button>
              </div>
              {dateType === 'custom' && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full bg-[#1e1f26] border border-[#292931] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#5a45ff]"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#c8c4d9] mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#5a45ff]" />
                Due Time
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full bg-[#1e1f26] border border-[#292931] rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-[#5a45ff]"
              />
            </div>
          </div>

          {/* 5. Repeat & Tone Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Repeat */}
            <div>
              <label className="block text-xs font-medium text-[#c8c4d9] mb-1 flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5 text-[#00f5a0]" />
                Repeat Schedule
              </label>
              <select
                value={repeatType}
                onChange={(e) => setRepeatType(e.target.value)}
                className="w-full bg-[#12131a] border border-[#292931] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#5a45ff]"
              >
                <option value="">Does not repeat</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKDAYS">Every Weekday (Mon-Fri)</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>

            {/* Alarm Tone */}
            <div>
              <label className="block text-xs font-medium text-[#c8c4d9] mb-1 flex items-center gap-1">
                <Music className="w-3.5 h-3.5 text-[#5a45ff]" />
                Alarm Tone
              </label>
              <select
                value={alarmToneTitle}
                onChange={(e) => {
                  const opt = TONE_OPTIONS.find((t) => t.title === e.target.value);
                  setAlarmToneTitle(e.target.value);
                  if (opt) setAlarmToneUri(opt.uri);
                }}
                className="w-full bg-[#12131a] border border-[#292931] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#5a45ff]"
              >
                {TONE_OPTIONS.map((tone) => (
                  <option key={tone.title} value={tone.title}>
                    {tone.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional Weekly Days Selector */}
          {repeatType === 'WEEKLY' && (
            <div className="bg-[#12131a] p-2.5 rounded-xl border border-[#292931]">
              <span className="block text-[11px] text-[#918ea2] mb-1.5">Repeat on days:</span>
              <div className="flex items-center gap-1 flex-wrap">
                {WEEK_DAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleToggleDay(d)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                      selectedWeekDays.includes(d)
                        ? 'bg-[#5a45ff] text-white'
                        : 'bg-[#1e1f26] text-[#918ea2]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 6. Location & Geofence (Optional) */}
          <div className="bg-[#12131a] p-3 rounded-xl border border-[#292931] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#c8c4d9] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#0284c7]" />
                Location & Geofence
              </label>
              <button
                type="button"
                onClick={handleFetchCurrentLocation}
                disabled={isGettingLocation}
                className="text-[11px] text-[#00f5a0] hover:underline flex items-center gap-1"
              >
                <Navigation className={`w-3 h-3 ${isGettingLocation ? 'animate-spin' : ''}`} />
                <span>{isGettingLocation ? 'Detecting...' : 'Current GPS'}</span>
              </button>
            </div>

            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Office, Gym, Home"
              className="w-full bg-[#1e1f26] border border-[#292931] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-[#6b687c] outline-none focus:border-[#5a45ff]"
            />

            {locationName && (
              <div className="flex items-center justify-between gap-3 text-[11px] text-[#918ea2] pt-1">
                <span>Radius: {locationRadius}m (AI Alert)</span>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={locationRadius}
                  onChange={(e) => setLocationRadius(Number(e.target.value))}
                  className="w-32 accent-[#5a45ff]"
                />
              </div>
            )}
          </div>

          {/* 7. Photos / Files Attachment */}
          <div className="bg-[#12131a] p-3 rounded-xl border border-[#292931] flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <Paperclip className="w-4 h-4 text-[#ffb77d] flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-white truncate">
                  {attachmentName || 'Attach Photo / Document'}
                </span>
                <span className="text-[10px] text-[#918ea2]">Saved to task metadata</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {attachmentName ? (
                <button
                  type="button"
                  onClick={() => {
                    setAttachmentName(null);
                    setAttachmentUri(null);
                  }}
                  className="p-1 rounded text-[#ffb4ab] hover:bg-[#93000a]/30"
                  title="Remove attachment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-[#292931] hover:bg-[#33343c] text-white text-[11px] font-medium transition-colors">
                  Browse
                  <input type="file" onChange={handleFileUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* 8. Parent Task Assignment (Hierarchy) */}
          {allTasks.length > 0 && !subtaskParent && (
            <div>
              <label className="block text-xs font-medium text-[#c8c4d9] mb-1">
                Parent Task (Optional)
              </label>
              <select
                value={parentId || ''}
                onChange={(e) => setParentId(e.target.value || null)}
                className="w-full bg-[#12131a] border border-[#292931] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#5a45ff]"
              >
                <option value="">No Parent (Root Task)</option>
                {allTasks
                  .filter((t) => !t.parentId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
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
              disabled={!title.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#5a45ff] hover:bg-[#6e5aff] disabled:opacity-40 text-white transition-all shadow-md shadow-[#5a45ff]/25 active:scale-95 cursor-pointer"
            >
              {subtaskParent ? 'Add Subtask' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
