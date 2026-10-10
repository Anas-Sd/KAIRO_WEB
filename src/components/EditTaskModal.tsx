import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Repeat,
  Music,
  Paperclip,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { Task, Priority } from '../types/task';
import { RepeatPickerDialog } from './RepeatPickerDialog';
import { TonePickerDialog } from './TonePickerDialog';
import { LocationPickerDialog } from './LocationPickerDialog';

interface EditTaskModalProps {
  task: Task | null;
  allTasks?: Task[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTask: Task) => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [repeatType, setRepeatType] = useState<string | null>(null);
  const [repeatDays, setRepeatDays] = useState<string | null>(null);
  const [repeatDates, setRepeatDates] = useState<string | null>(null);
  const [repeatSummaryText, setRepeatSummaryText] = useState('Does not repeat');

  const [selectedPriority, setSelectedPriority] = useState<Priority>('LOW');
  const [priorityMenuExpanded, setPriorityMenuExpanded] = useState(false);

  const [selectedDateMillis, setSelectedDateMillis] = useState<number>(Date.now());
  const [selectedDateText, setSelectedDateText] = useState('Today');
  const [selectedTimeText, setSelectedTimeText] = useState('12:00');
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState('');
  const [pickerTime, setPickerTime] = useState('');

  const [showTonePicker, setShowTonePicker] = useState(false);
  const [alarmToneTitle, setAlarmToneTitle] = useState('Default Alarm Tone');
  const [alarmToneUri, setAlarmToneUri] = useState<string | null>(null);

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationText, setLocationText] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationRadius, setLocationRadius] = useState<number>(500);

  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentUri, setAttachmentUri] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setNotes(task.notes || '');
      setSelectedPriority(task.priority || 'LOW');

      setSelectedDateText(task.dueDate || 'Today');
      setSelectedDateMillis(task.dueDateMillis || Date.now());
      setSelectedTimeText(task.dueTime || '12:00');

      const d = task.dueDateMillis ? new Date(task.dueDateMillis) : new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setPickerDate(`${yyyy}-${mm}-${dd}`);
      setPickerTime(task.dueTime || '12:00');

      setRepeatType(task.repeatType || null);
      setRepeatDays(task.repeatDays || null);
      setRepeatDates(task.repeatDates || null);

      // Compute repeat summary text matching Android
      if (task.repeatType === 'BOTH') {
        const days = task.repeatDays?.split(',').map((s) => s.trim()).filter(Boolean) || [];
        const daysStr =
          days.length === 7
            ? 'Everyday'
            : days.length === 5 && !days.includes('SAT') && !days.includes('SUN')
            ? 'Weekdays'
            : days.length === 2 && days.includes('SAT') && days.includes('SUN')
            ? 'Weekends'
            : 'Every ' + days.map((d) => d.slice(0, 3)).join(', ');
        const dates = task.repeatDates?.split(',').map((s) => s.trim()).filter(Boolean) || [];
        const datesStr = dates.length === 1 ? dates[0] : `${dates.length} specific dates`;
        setRepeatSummaryText(`${daysStr} + ${datesStr}`);
      } else if (task.repeatType === 'DAYS') {
        const days = task.repeatDays?.split(',').map((s) => s.trim()).filter(Boolean) || [];
        const daysStr =
          days.length === 7
            ? 'Everyday'
            : days.length === 5 && !days.includes('SAT') && !days.includes('SUN')
            ? 'Weekdays'
            : days.length === 2 && days.includes('SAT') && days.includes('SUN')
            ? 'Weekends'
            : 'Every ' + days.map((d) => d.slice(0, 3)).join(', ');
        setRepeatSummaryText(daysStr);
      } else if (task.repeatType === 'DATES') {
        const dates = task.repeatDates?.split(',').map((s) => s.trim()).filter(Boolean) || [];
        const datesStr = dates.length === 1 ? dates[0] : `${dates.length} specific dates`;
        setRepeatSummaryText(datesStr);
      } else {
        setRepeatSummaryText('Does not repeat');
      }

      setAlarmToneTitle(task.alarmToneTitle || 'Default Alarm Tone');
      setAlarmToneUri(task.alarmToneUri || null);
      setLocationText(task.location || '');
      setLatitude(task.latitude ?? null);
      setLongitude(task.longitude ?? null);
      setLocationRadius(task.locationRadius ?? 500);
      setAttachmentName(task.attachmentName || null);
      setAttachmentUri(task.attachmentUri || null);
      setShowDateTimePicker(false);
      setShowRepeatPicker(false);
      setShowTonePicker(false);
      setShowLocationPicker(false);
    }
  }, [task]);

  if (!isOpen || !task) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const todayEnd = todayStart + 86400000;

    let computedSection: 'OVERDUE' | 'TODAY' | 'UPCOMING' = 'TODAY';
    if (selectedDateText.toLowerCase().includes('yesterday') || selectedDateMillis < todayStart) {
      computedSection = 'OVERDUE';
    } else if (
      selectedDateText.toLowerCase().includes('today') ||
      (selectedDateMillis >= todayStart && selectedDateMillis < todayEnd)
    ) {
      computedSection = 'TODAY';
    } else {
      computedSection = 'UPCOMING';
    }

    onUpdate({
      ...task,
      title: title.trim(),
      notes: notes.trim() || null,
      priority: selectedPriority,
      dueDate: selectedDateText,
      dueDateMillis: selectedDateMillis,
      dueTime: selectedTimeText,
      section: computedSection,
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
      updatedAt: Date.now(),
    });

    onClose();
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case 'LOW':
        return 'bg-[#26E0BA] text-[#130067]';
      case 'MEDIUM':
        return 'bg-[#5a45ff] text-white';
      case 'HIGH':
        return 'bg-[#ffb77d] text-[#4a2800]';
      case 'URGENT':
        return 'bg-[#ffb4ab] text-[#690005]';
    }
  };

  const getPriorityLabel = (p: Priority) => {
    switch (p) {
      case 'LOW':
        return 'Low';
      case 'MEDIUM':
        return 'Medium';
      case 'HIGH':
        return 'High';
      case 'URGENT':
        return 'Urgent';
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#15131e] border border-[#333140] rounded-[24px] p-5 shadow-2xl flex flex-col gap-3.5 text-white animate-scale-up max-h-[92vh] overflow-y-auto">
        {/* Header: Title & Close Button */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-white">Edit Task</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#c8c4d9] hover:bg-[#252233] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* 1. Task Name Input (Mandatory) */}
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name of task"
            className="w-full h-12 bg-[#201d2c] border border-[#333140] focus:border-[#5a45ff] rounded-2xl px-4 text-sm text-white placeholder-[#6b687c] outline-none transition-colors"
          />

          {/* 2. Notes Input (Optional) */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full bg-[#201d2c] border border-[#333140] focus:border-[#5a45ff] rounded-2xl p-3.5 text-xs text-white placeholder-[#6b687c] outline-none resize-none transition-colors"
          />

          {/* 3. Repeat Selector Surface */}
          <div
            onClick={() => setShowRepeatPicker(true)}
            className="w-full h-12 bg-[#201d2c] border border-[#333140] hover:border-[#5a45ff]/40 rounded-2xl px-3.5 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Repeat
                className={`w-4 h-4 ${
                  repeatType ? 'text-[#5a45ff]' : 'text-[#918ea2]'
                }`}
              />
              <span
                className={`text-xs truncate ${
                  repeatType ? 'text-white font-semibold' : 'text-[#c8c4d9]'
                }`}
              >
                Repeat: {repeatSummaryText}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#c8c4d9] flex-shrink-0" />
          </div>

          {/* 4. Priority Dropdown beside Date & Time Selector */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <div
                onClick={() => setPriorityMenuExpanded(!priorityMenuExpanded)}
                className="h-12 bg-[#201d2c] border border-[#333140] hover:border-[#5a45ff]/40 rounded-2xl px-3 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedPriority === 'LOW'
                        ? 'bg-[#26E0BA]'
                        : selectedPriority === 'MEDIUM'
                        ? 'bg-[#5a45ff]'
                        : selectedPriority === 'HIGH'
                        ? 'bg-[#ffb77d]'
                        : 'bg-[#ffb4ab]'
                    }`}
                  />
                  <span className="text-xs font-semibold text-white">
                    {getPriorityLabel(selectedPriority)}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-[#c8c4d9]" />
              </div>

              {priorityMenuExpanded && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setPriorityMenuExpanded(false)}
                  />
                  <div className="absolute left-0 top-14 z-40 w-full bg-[#201d2c] border border-[#333140] rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1">
                    {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as Priority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setSelectedPriority(p);
                          setPriorityMenuExpanded(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors ${
                          selectedPriority === p
                            ? 'bg-[#5a45ff]/20 text-white font-bold'
                            : 'text-[#c8c4d9] hover:bg-[#29263a]'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            p === 'LOW'
                              ? 'bg-[#26E0BA]'
                              : p === 'MEDIUM'
                              ? 'bg-[#5a45ff]'
                              : p === 'HIGH'
                              ? 'bg-[#ffb77d]'
                              : 'bg-[#ffb4ab]'
                          }`}
                        />
                        <span>{getPriorityLabel(p)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div
              onClick={() => setShowDateTimePicker(true)}
              className="flex-[1.3] h-12 bg-[#201d2c] border border-[#333140] hover:border-[#5a45ff]/40 rounded-2xl px-3 flex items-center gap-2 cursor-pointer transition-colors"
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
            className="w-full h-12 bg-[#201d2c] border border-[#333140] hover:border-[#5a45ff]/40 rounded-2xl px-3.5 flex items-center justify-between cursor-pointer transition-colors"
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
            className="w-full h-12 bg-[#201d2c] border border-[#333140] hover:border-[#5a45ff]/40 rounded-2xl px-3.5 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <MapPin
                className={`w-4 h-4 ${
                  locationText ? 'text-[#5a45ff]' : 'text-[#918ea2]'
                }`}
              />
              <span
                className={`text-xs truncate ${
                  locationText ? 'text-white font-medium' : 'text-[#6b687c]'
                }`}
              >
                {locationText
                  ? `${locationText} (${locationRadius}m)`
                  : 'Location & Geofence (optional)'}
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
          <div className="w-full h-12 bg-[#201d2c] border border-[#333140] hover:border-[#5a45ff]/40 rounded-2xl px-3.5 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <Paperclip
                className={`w-4 h-4 ${
                  attachmentName ? 'text-[#5a45ff]' : 'text-[#918ea2]'
                }`}
              />
              <span
                className={`text-xs truncate ${
                  attachmentName ? 'text-white font-medium' : 'text-[#918ea2]'
                }`}
              >
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

          {/* 8. Action Buttons: Cancel and Save */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-2xl border border-[#333140] hover:bg-[#201d2c] text-xs font-semibold text-[#c8c4d9] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 h-12 rounded-2xl bg-[#5a45ff] hover:bg-[#6b58ff] disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-[#130067] shadow-lg shadow-[#5a45ff]/20 transition-all active:scale-[0.98]"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Date & Time Picker Modal */}
      {showDateTimePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#15131e] border border-[#333140] rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-white">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#5a45ff]" />
              Select Date & Time
            </h3>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[#918ea2] block mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={pickerDate}
                  onChange={(e) => setPickerDate(e.target.value)}
                  className="w-full h-11 bg-[#201d2c] border border-[#333140] rounded-xl px-3 text-xs text-white outline-none focus:border-[#5a45ff]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#918ea2] block mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={pickerTime}
                  onChange={(e) => setPickerTime(e.target.value)}
                  className="w-full h-11 bg-[#201d2c] border border-[#333140] rounded-xl px-3 text-xs text-white outline-none focus:border-[#5a45ff]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDateTimePicker(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#333140] text-xs font-semibold text-[#c8c4d9] hover:bg-[#201d2c]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDateTime}
                className="flex-1 py-2.5 rounded-xl bg-[#5a45ff] text-xs font-bold text-[#130067] hover:bg-[#6b58ff]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repeat Picker Dialog */}
      {showRepeatPicker && (
        <RepeatPickerDialog
          initialRepeatType={repeatType}
          initialRepeatDays={repeatDays}
          initialRepeatDates={repeatDates}
          onDismiss={() => setShowRepeatPicker(false)}
          onConfirm={(type, days, dates, summary) => {
            setRepeatType(type);
            setRepeatDays(days);
            setRepeatDates(dates);
            setRepeatSummaryText(summary);
            setShowRepeatPicker(false);
          }}
        />
      )}

      {/* Tone Picker Dialog */}
      {showTonePicker && (
        <TonePickerDialog
          initialUri={alarmToneUri}
          initialTitle={alarmToneTitle}
          onDismiss={() => setShowTonePicker(false)}
          onConfirm={(uri, toneTitle) => {
            setAlarmToneUri(uri);
            setAlarmToneTitle(toneTitle);
            setShowTonePicker(false);
          }}
        />
      )}

      {/* Location Picker Dialog */}
      {showLocationPicker && (
        <LocationPickerDialog
          initialLocation={locationText}
          initialLat={latitude}
          initialLng={longitude}
          initialRadius={locationRadius}
          onDismiss={() => setShowLocationPicker(false)}
          onConfirm={(name, lat, lng, radius) => {
            setLocationText(name || '');
            setLatitude(lat);
            setLongitude(lng);
            setLocationRadius(radius);
            setShowLocationPicker(false);
          }}
        />
      )}
    </div>
  );
};
