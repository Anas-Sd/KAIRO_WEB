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
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { Task, Priority } from '../types/task';

interface CreateTaskModalProps {
  isOpen: boolean;
  subtaskParent?: Task | null;
  allTasks?: Task[];
  defaultSection?: string;
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
  onClose,
  onCreate,
}) => {
  // 1. Task Name & Notes (Android OutlinedTextField)
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  // 2. Repeat State (Android Surface)
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [repeatType, setRepeatType] = useState<string | null>(null);
  const [repeatDays, setRepeatDays] = useState<string | null>(null);
  const [repeatDates, setRepeatDates] = useState<string | null>(null);
  const [selectedWeekDays, setSelectedWeekDays] = useState<string[]>([]);
  const [repeatSummaryText, setRepeatSummaryText] = useState('Does not repeat');

  // 3. Priority State (Android Dropdown)
  const [selectedPriority, setSelectedPriority] = useState<Priority>('LOW');
  const [priorityMenuExpanded, setPriorityMenuExpanded] = useState(false);

  // 4. Date & Time State (Android Date & Time Surface)
  const [selectedDateMillis, setSelectedDateMillis] = useState<number>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });
  const [selectedDateText, setSelectedDateText] = useState('Today');
  const [selectedTimeText, setSelectedTimeText] = useState(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  });
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [pickerTime, setPickerTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  // 5. Alarm Tone State (Android Tone Selector)
  const [showTonePicker, setShowTonePicker] = useState(false);
  const [alarmToneTitle, setAlarmToneTitle] = useState('Default Alarm Tone');
  const [alarmToneUri, setAlarmToneUri] = useState('default');

  // 6. Location State (Android Location Selector)
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationText, setLocationText] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationRadius, setLocationRadius] = useState<number>(500);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // 7. Photos / File Selection
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentUri, setAttachmentUri] = useState<string | null>(null);

  // 8. Parent Task
  const [parentId, setParentId] = useState<string | null>(subtaskParent ? subtaskParent.id : null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setNotes('');
      setRepeatType(null);
      setRepeatDays(null);
      setRepeatDates(null);
      setSelectedWeekDays([]);
      setRepeatSummaryText('Does not repeat');
      setSelectedPriority('LOW');
      setPriorityMenuExpanded(false);

      const now = new Date();
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      setSelectedDateMillis(todayMidnight.getTime());
      setSelectedDateText('Today');

      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setSelectedTimeText(`${hh}:${mm}`);
      setPickerDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
      setPickerTime(`${hh}:${mm}`);

      setAlarmToneTitle('Default Alarm Tone');
      setAlarmToneUri('default');
      setLocationText('');
      setLatitude(null);
      setLongitude(null);
      setLocationRadius(500);
      setAttachmentName(null);
      setAttachmentUri(null);
      setParentId(subtaskParent ? subtaskParent.id : null);
      setShowDateTimePicker(false);
      setShowRepeatPicker(false);
      setShowTonePicker(false);
      setShowLocationPicker(false);
    }
  }, [isOpen, subtaskParent]);

  if (!isOpen) return null;

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

  // GPS Geolocation Helper
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
        if (!locationText) {
          setLocationText(`GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
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

  // Confirm Date & Time from picker
  const handleConfirmDateTime = () => {
    const parts = pickerDate.split('-');
    if (parts.length === 3) {
      const chosen = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0, 0);
      setSelectedDateMillis(chosen.getTime());

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today.getTime() + 86400000);

      if (chosen.getTime() === today.getTime()) {
        setSelectedDateText('Today');
      } else if (chosen.getTime() === tomorrow.getTime()) {
        setSelectedDateText('Tomorrow');
      } else {
        setSelectedDateText(chosen.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      }
    }
    setSelectedTimeText(pickerTime || '12:00');
    setShowDateTimePicker(false);
  };

  // Handle Repeat changes
  const handleToggleDay = (day: string) => {
    const updated = selectedWeekDays.includes(day)
      ? selectedWeekDays.filter((d) => d !== day)
      : [...selectedWeekDays, day];
    setSelectedWeekDays(updated);
    setRepeatDays(updated.join(','));
  };

  const handleConfirmRepeat = (type: string | null) => {
    if (!type) {
      setRepeatType(null);
      setRepeatDays(null);
      setRepeatDates(null);
      setRepeatSummaryText('Does not repeat');
    } else if (type === 'DAILY') {
      setRepeatType('DAILY');
      setRepeatSummaryText('Daily');
    } else if (type === 'WEEKDAYS') {
      setRepeatType('WEEKDAYS');
      setRepeatSummaryText('Every Weekday (Mon-Fri)');
    } else if (type === 'WEEKLY') {
      setRepeatType('WEEKLY');
      setRepeatSummaryText(selectedWeekDays.length > 0 ? `Weekly (${selectedWeekDays.join(', ')})` : 'Weekly');
    } else if (type === 'MONTHLY') {
      setRepeatType('MONTHLY');
      setRepeatSummaryText('Monthly');
    }
    setShowRepeatPicker(false);
  };

  // Handle Submit exactly matching Android
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Assigned Section calculation matching TaskViewModel.kt
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const todayEnd = todayStart + 86400000;

    let computedSection: 'OVERDUE' | 'TODAY' | 'UPCOMING' = 'TODAY';
    if (selectedDateText.toLowerCase().includes('yesterday') || selectedDateMillis < todayStart) {
      computedSection = 'OVERDUE';
    } else if (selectedDateText.toLowerCase().includes('today') || (selectedDateMillis >= todayStart && selectedDateMillis < todayEnd)) {
      computedSection = 'TODAY';
    } else {
      computedSection = 'UPCOMING';
    }

    onCreate({
      title: title.trim(),
      notes: notes.trim() || null,
      priority: selectedPriority,
      dueDate: selectedDateText,
      dueDateMillis: selectedDateMillis,
      dueTime: selectedTimeText,
      section: computedSection,
      parentId: parentId || null,
      repeatType: repeatType || null,
      repeatDays: repeatDays || null,
      repeatDates: repeatDates || null,
      alarmToneTitle: alarmToneTitle || null,
      alarmToneUri: alarmToneUri || null,
      location: locationText.trim() || null,
      latitude,
      longitude,
      locationRadius,
      attachmentName: attachmentName || null,
      attachmentUri: attachmentUri || null,
    });

    onClose();
  };

  const getPriorityLabel = (p: Priority) => {
    switch (p) {
      case 'LOW':
        return 'Low';
      case 'MEDIUM':
        return 'Med';
      case 'HIGH':
        return 'High';
      case 'URGENT':
        return 'Urgent';
    }
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case 'LOW':
        return 'bg-[#00f5a0]';
      case 'MEDIUM':
        return 'bg-[#5a45ff]';
      case 'HIGH':
        return 'bg-[#ffb77d]';
      case 'URGENT':
        return 'bg-[#ffb4ab]';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-entrance">
      <div className="bg-[#12131a] border border-[#292931] rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl flex flex-col gap-3.5 max-h-[92vh] overflow-y-auto">
        {/* Header: Title ("Task") & Close (X) button */}
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-xl font-bold text-white font-display">Task</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#c8c4d9] hover:text-white hover:bg-[#1a1b22] transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {subtaskParent && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5a45ff]/15 border border-[#5a45ff]/25 text-xs text-[#c5c0ff]">
            <CornerDownRight className="w-3.5 h-3.5 text-[#5a45ff]" />
            <span>Under: <strong className="text-white">{subtaskParent.title}</strong></span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* 1. Task Name Input (Mandatory, single line) */}
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name of task"
            className="w-full bg-[#1e1f26] border border-[#33343c] focus:border-[#5a45ff] rounded-2xl px-4 py-3 text-sm text-white placeholder:text-[#6b687c] outline-none transition-all"
          />

          {/* 2. Notes Input (Optional, reduced sleek height) */}
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full bg-[#1e1f26] border border-[#33343c] focus:border-[#5a45ff] rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-[#6b687c] outline-none transition-all resize-none"
          />

          {/* 3. Repeat Selector Surface */}
          <div
            onClick={() => setShowRepeatPicker(true)}
            className="w-full h-12 bg-[#1e1f26] border border-[#33343c] hover:border-[#5a45ff]/40 rounded-2xl px-3.5 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Repeat className={`w-4 h-4 ${repeatType ? 'text-[#5a45ff]' : 'text-[#918ea2]'}`} />
              <span className={`text-xs truncate ${repeatType ? 'text-white font-medium' : 'text-[#c8c4d9]'}`}>
                Repeat: {repeatSummaryText}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#c8c4d9] flex-shrink-0" />
          </div>

          {/* 4. Priority Dropdown beside Date & Time Selector (Exact Side-by-Side Row) */}
          <div className="flex items-center gap-2.5">
            {/* Priority Selector (Left, weight 1) */}
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => setPriorityMenuExpanded(!priorityMenuExpanded)}
                className="w-full h-12 bg-[#1e1f26] border border-[#33343c] hover:border-[#5a45ff]/40 rounded-2xl px-3 flex items-center justify-between text-xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${getPriorityColor(selectedPriority)}`} />
                  <span className="font-semibold text-white">{getPriorityLabel(selectedPriority)}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-[#c8c4d9]" />
              </button>

              {priorityMenuExpanded && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setPriorityMenuExpanded(false)} />
                  <div className="absolute left-0 top-14 z-40 w-full bg-[#1e1f26] border border-[#33343c] rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 animate-entrance">
                    {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as Priority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setSelectedPriority(p);
                          setPriorityMenuExpanded(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors ${
                          selectedPriority === p ? 'bg-[#5a45ff]/20 text-white font-bold' : 'text-[#c8c4d9] hover:bg-[#292931]'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${getPriorityColor(p)}`} />
                        <span>{getPriorityLabel(p)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Date & Time Selector (Right side beside priority, weight 1.3) */}
            <div
              onClick={() => setShowDateTimePicker(true)}
              className="flex-[1.3] h-12 bg-[#1e1f26] border border-[#33343c] hover:border-[#5a45ff]/40 rounded-2xl px-3 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Calendar className="w-4 h-4 text-[#5a45ff] flex-shrink-0" />
              <span className="text-xs font-medium text-white truncate">
                {selectedDateText}, {selectedTimeText}
              </span>
            </div>
          </div>

          {/* 5. Tone Selector Surface */}
          <div
            onClick={() => setShowTonePicker(true)}
            className="w-full h-12 bg-[#1e1f26] border border-[#33343c] hover:border-[#5a45ff]/40 rounded-2xl px-3.5 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Music className="w-4 h-4 text-[#5a45ff]" />
              <span className="text-xs text-white font-medium truncate">
                Tone: {alarmToneTitle}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#c8c4d9] flex-shrink-0" />
          </div>

          {/* 6. Location Selector Surface */}
          <div
            onClick={() => setShowLocationPicker(true)}
            className="w-full h-12 bg-[#1e1f26] border border-[#33343c] hover:border-[#5a45ff]/40 rounded-2xl px-3.5 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <MapPin className={`w-4 h-4 ${locationText ? 'text-[#5a45ff]' : 'text-[#918ea2]'}`} />
              <span className={`text-xs truncate ${locationText ? 'text-white font-medium' : 'text-[#6b687c]'}`}>
                {locationText ? `${locationText} (${locationRadius}m)` : 'Location & Geofence (optional)'}
              </span>
            </div>
            {locationText && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocationText('');
                  setLatitude(null);
                  setLongitude(null);
                }}
                className="p-1 text-[#918ea2] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 7. Photos / File Selection Button */}
          <div className="w-full h-12 bg-[#1e1f26] border border-[#33343c] hover:border-[#5a45ff]/40 rounded-2xl px-3.5 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <Paperclip className={`w-4 h-4 ${attachmentName ? 'text-[#5a45ff]' : 'text-[#918ea2]'}`} />
              <span className={`text-xs truncate ${attachmentName ? 'text-white font-medium' : 'text-[#918ea2]'}`}>
                {attachmentName || 'Photos / Files'}
              </span>
            </div>

            {attachmentName ? (
              <button
                type="button"
                onClick={() => {
                  setAttachmentName(null);
                  setAttachmentUri(null);
                }}
                className="p-1 text-[#ffb4ab] hover:text-white"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <label className="cursor-pointer text-[11px] font-semibold text-[#5a45ff] hover:underline">
                Browse
                <input type="file" onChange={handleFileUpload} className="hidden" />
              </label>
            )}
          </div>

          {/* 8. Parent Task Selection (Hierarchy) */}
          {allTasks.length > 0 && !subtaskParent && (
            <div className="pt-1">
              <select
                value={parentId || ''}
                onChange={(e) => setParentId(e.target.value || null)}
                className="w-full h-11 bg-[#1e1f26] border border-[#33343c] rounded-2xl px-3 text-xs text-[#c8c4d9] outline-none focus:border-[#5a45ff]"
              >
                <option value="">No Parent (Root Task)</option>
                {allTasks
                  .filter((t) => !t.parentId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      Under: {t.title}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* 9. Action Buttons: Cancel and Create */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-2xl border border-[#33343c] hover:bg-[#1a1b22] text-[#c8c4d9] text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 h-12 rounded-2xl bg-[#5a45ff] hover:bg-[#6e5aff] disabled:opacity-40 text-white text-sm font-semibold shadow-lg shadow-[#5a45ff]/25 transition-all"
            >
              Create
            </button>
          </div>
        </form>

        {/* =========================================================================
            POPOVERS & SUB-DIALOGS (Matching Android)
           ========================================================================= */}
        {/* Date & Time Picker Dialog */}
        {showDateTimePicker && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-entrance">
            <div className="bg-[#1a1b22] border border-[#33343c] rounded-3xl w-full max-w-xs p-5 shadow-2xl flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#5a45ff]" />
                Select Date & Time
              </h3>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] text-[#918ea2]">Date</label>
                <input
                  type="date"
                  value={pickerDate}
                  onChange={(e) => setPickerDate(e.target.value)}
                  className="w-full bg-[#12131a] border border-[#33343c] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#5a45ff]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] text-[#918ea2]">Time</label>
                <input
                  type="time"
                  value={pickerTime}
                  onChange={(e) => setPickerTime(e.target.value)}
                  className="w-full bg-[#12131a] border border-[#33343c] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#5a45ff]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#33343c]">
                <button
                  type="button"
                  onClick={() => setShowDateTimePicker(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-[#c8c4d9] hover:bg-[#292931]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDateTime}
                  className="px-4 py-1.5 rounded-xl bg-[#5a45ff] text-white text-xs font-semibold"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Repeat Picker Dialog */}
        {showRepeatPicker && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-entrance">
            <div className="bg-[#1a1b22] border border-[#33343c] rounded-3xl w-full max-w-xs p-5 shadow-2xl flex flex-col gap-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Repeat className="w-4 h-4 text-[#5a45ff]" />
                Repeat Schedule
              </h3>

              <div className="flex flex-col gap-1.5">
                {[
                  { key: null, label: 'Does not repeat' },
                  { key: 'DAILY', label: 'Daily' },
                  { key: 'WEEKDAYS', label: 'Every Weekday (Mon-Fri)' },
                  { key: 'WEEKLY', label: 'Weekly' },
                  { key: 'MONTHLY', label: 'Monthly' },
                ].map((item) => (
                  <button
                    key={String(item.key)}
                    type="button"
                    onClick={() => handleConfirmRepeat(item.key)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-[#c8c4d9] hover:text-white hover:bg-[#292931] transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {repeatType === 'WEEKLY' && (
                <div className="pt-2 border-t border-[#33343c]">
                  <span className="block text-[11px] text-[#918ea2] mb-1.5">Days of Week:</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {WEEK_DAYS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleToggleDay(d)}
                        className={`px-2 py-1 rounded text-[10px] font-semibold ${
                          selectedWeekDays.includes(d) ? 'bg-[#5a45ff] text-white' : 'bg-[#12131a] text-[#918ea2]'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowRepeatPicker(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-[#c8c4d9] hover:bg-[#292931]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tone Picker Dialog */}
        {showTonePicker && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-entrance">
            <div className="bg-[#1a1b22] border border-[#33343c] rounded-3xl w-full max-w-xs p-5 shadow-2xl flex flex-col gap-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Music className="w-4 h-4 text-[#5a45ff]" />
                Select Alarm Tone
              </h3>
              <div className="flex flex-col gap-1">
                {TONE_OPTIONS.map((t) => (
                  <button
                    key={t.title}
                    type="button"
                    onClick={() => {
                      setAlarmToneTitle(t.title);
                      setAlarmToneUri(t.uri);
                      setShowTonePicker(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors ${
                      alarmToneTitle === t.title ? 'bg-[#5a45ff]/20 text-white font-bold' : 'text-[#c8c4d9] hover:bg-[#292931]'
                    }`}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowTonePicker(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-[#c8c4d9] hover:bg-[#292931]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Location & Geofence Dialog */}
        {showLocationPicker && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-entrance">
            <div className="bg-[#1a1b22] border border-[#33343c] rounded-3xl w-full max-w-sm p-5 shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#5a45ff]" />
                  Location & Geofence
                </h3>
                <button
                  type="button"
                  onClick={handleFetchCurrentLocation}
                  disabled={isGettingLocation}
                  className="text-[11px] text-[#00f5a0] hover:underline flex items-center gap-1"
                >
                  <Navigation className={`w-3 h-3 ${isGettingLocation ? 'animate-spin' : ''}`} />
                  <span>{isGettingLocation ? 'Detecting...' : 'Use GPS'}</span>
                </button>
              </div>

              <input
                type="text"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="Location name (e.g. Office, Gym)"
                className="w-full bg-[#12131a] border border-[#33343c] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#5a45ff]"
              />

              <div className="flex flex-col gap-1.5 text-xs text-[#918ea2]">
                <div className="flex items-center justify-between">
                  <span>Radius: {locationRadius}m</span>
                  <span className="text-[#5a45ff]">AI Alert</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={locationRadius}
                  onChange={(e) => setLocationRadius(Number(e.target.value))}
                  className="w-full accent-[#5a45ff]"
                />
              </div>

              <div className="flex justify-end pt-2 border-t border-[#33343c]">
                <button
                  type="button"
                  onClick={() => setShowLocationPicker(false)}
                  className="px-4 py-1.5 rounded-xl bg-[#5a45ff] text-white text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
