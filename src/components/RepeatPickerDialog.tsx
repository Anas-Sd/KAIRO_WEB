import React, { useState } from 'react';
import { X, Repeat, Plus, Calendar } from 'lucide-react';

export const ALL_WEEK_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
export const DAY_LABELS: Record<string, string> = {
  MON: 'M',
  TUE: 'T',
  WED: 'W',
  THU: 'T',
  FRI: 'F',
  SAT: 'S',
  SUN: 'S',
};

interface RepeatPickerDialogProps {
  initialRepeatType?: string | null; // "NONE", "DAYS", "DATES", "BOTH"
  initialRepeatDays?: string | null; // "MON,WED"
  initialRepeatDates?: string | null; // "Oct 5, Oct 12"
  onDismiss: () => void;
  onConfirm: (
    repeatType: string | null,
    repeatDays: string | null,
    repeatDates: string | null,
    summary: string
  ) => void;
}

export const RepeatPickerDialog: React.FC<RepeatPickerDialogProps> = ({
  initialRepeatType,
  initialRepeatDays,
  initialRepeatDates,
  onDismiss,
  onConfirm,
}) => {
  const [selectedTab, setSelectedTab] = useState<number>(
    initialRepeatType === 'DATES' ? 1 : 0
  );

  // Days selection state
  const [selectedDays, setSelectedDays] = useState<string[]>(() => {
    if (initialRepeatDays) {
      return initialRepeatDays
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  });

  // Specific dates selection state
  const [selectedDates, setSelectedDates] = useState<string[]>(() => {
    if (initialRepeatDates) {
      return initialRepeatDates
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  });

  const [dateInputValue, setDateInputValue] = useState('');

  // Handle adding specific date
  const handleAddDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    const parts = val.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!selectedDates.includes(formatted)) {
        setSelectedDates((prev) => [...prev, formatted]);
      }
    }
    setDateInputValue('');
  };

  const handleRemoveDate = (dateStr: string) => {
    setSelectedDates((prev) => prev.filter((d) => d !== dateStr));
  };

  const handleToggleDay = (dayKey: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayKey) ? prev.filter((d) => d !== dayKey) : [...prev, dayKey]
    );
  };

  // Live combined schedule summary calculation matching RepeatPickerDialog.kt
  const calculateSummary = (days: string[], dates: string[]) => {
    const daysSummary =
      days.length === 7
        ? 'Everyday'
        : days.length === 5 && !days.includes('SAT') && !days.includes('SUN')
        ? 'Weekdays'
        : days.length === 2 && days.includes('SAT') && days.includes('SUN')
        ? 'Weekends'
        : days.length > 0
        ? 'Every ' + days.map((d) => d.slice(0, 3)).join(', ')
        : null;

    const datesSummary =
      dates.length === 1
        ? dates[0]
        : dates.length > 1
        ? `${dates.length} specific dates`
        : null;

    if (daysSummary && datesSummary) {
      return `${daysSummary} + ${datesSummary}`;
    }
    if (daysSummary) return daysSummary;
    if (datesSummary) return datesSummary;
    return 'Does not repeat';
  };

  const currentSummary = calculateSummary(selectedDays, selectedDates);

  const handleSave = () => {
    const hasDays = selectedDays.length > 0;
    const hasDates = selectedDates.length > 0;

    let type: string | null = null;
    let days: string | null = null;
    let dates: string | null = null;

    if (hasDays && hasDates) {
      type = 'BOTH';
      days = selectedDays.join(',');
      dates = selectedDates.join(',');
    } else if (hasDays) {
      type = 'DAYS';
      days = selectedDays.join(',');
    } else if (hasDates) {
      type = 'DATES';
      dates = selectedDates.join(',');
    }

    onConfirm(type, days, dates, currentSummary);
  };

  const handleNoRepeat = () => {
    setSelectedDays([]);
    setSelectedDates([]);
    onConfirm(null, null, null, 'Does not repeat');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#130067]/10 bg-[#15131e] border border-[#333140] rounded-[24px] p-5 shadow-2xl flex flex-col gap-4 text-white">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#5a45ff]/20 flex items-center justify-center text-[#5a45ff]">
              <Repeat className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">Repeat Task</h2>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded-full text-[#c8c4d9] hover:bg-[#252233] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs: Days of Week vs Specific Dates */}
        <div className="flex border-b border-[#2d2a3c]">
          <button
            type="button"
            onClick={() => setSelectedTab(0)}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              selectedTab === 0
                ? 'border-[#5a45ff] text-white font-bold'
                : 'border-transparent text-[#918ea2] hover:text-[#c8c4d9]'
            }`}
          >
            Days of Week {selectedDays.length > 0 && `(${selectedDays.length})`}
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab(1)}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              selectedTab === 1
                ? 'border-[#5a45ff] text-white font-bold'
                : 'border-transparent text-[#918ea2] hover:text-[#c8c4d9]'
            }`}
          >
            Specific Dates {selectedDates.length > 0 && `(${selectedDates.length})`}
          </button>
        </div>

        {/* TAB 1: DAYS OF WEEK */}
        {selectedTab === 0 && (
          <div className="flex flex-col gap-3 py-1">
            <span className="text-xs font-medium text-[#c8c4d9]">
              Repeat on specific days:
            </span>

            {/* 7 Day Circles: M T W T F S S */}
            <div className="flex items-center justify-between gap-1.5 pt-1">
              {ALL_WEEK_DAYS.map((dayKey) => {
                const isSelected = selectedDays.includes(dayKey);
                return (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() => handleToggleDay(dayKey)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-transform active:scale-95 ${
                      isSelected
                        ? 'bg-[#5a45ff] text-[#130067] shadow-md shadow-[#5a45ff]/30'
                        : 'bg-[#252233] text-white hover:bg-[#302d40]'
                    }`}
                  >
                    {DAY_LABELS[dayKey]}
                  </button>
                );
              })}
            </div>

            {/* 4 Quick Preset Buttons */}
            <div className="grid grid-cols-4 gap-1.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedDays([...ALL_WEEK_DAYS])}
                className="py-2 px-1 bg-[#252233] border border-[#5a45ff]/35 rounded-xl text-[11px] font-semibold text-[#5a45ff] hover:bg-[#5a45ff]/15 transition-colors text-center"
              >
                Everyday
              </button>
              <button
                type="button"
                onClick={() => setSelectedDays(['MON', 'TUE', 'WED', 'THU', 'FRI'])}
                className="py-2 px-1 bg-[#252233] border border-[#918ea2]/35 rounded-xl text-[11px] font-semibold text-[#d0bcff] hover:bg-[#d0bcff]/15 transition-colors text-center"
              >
                Weekdays
              </button>
              <button
                type="button"
                onClick={() => setSelectedDays(['SAT', 'SUN'])}
                className="py-2 px-1 bg-[#252233] border border-[#ffb77d]/35 rounded-xl text-[11px] font-semibold text-[#ffb77d] hover:bg-[#ffb77d]/15 transition-colors text-center"
              >
                Weekends
              </button>
              <button
                type="button"
                onClick={() => setSelectedDays([])}
                className="py-2 px-1 bg-[#252233] border border-[#ffb4ab]/35 rounded-xl text-[11px] font-semibold text-[#ffb4ab] hover:bg-[#ffb4ab]/15 transition-colors text-center"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SPECIFIC DATES */}
        {selectedTab === 1 && (
          <div className="flex flex-col gap-3 py-1">
            <span className="text-xs font-medium text-[#c8c4d9]">
              Pick specific dates to repeat:
            </span>

            <div className="flex flex-wrap gap-2 min-h-[50px] items-center">
              {selectedDates.map((dateStr) => (
                <div
                  key={dateStr}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#5a45ff]/15 border border-[#5a45ff]/60 text-white text-xs font-semibold"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#5a45ff]" />
                  <span>{dateStr}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDate(dateStr)}
                    className="p-0.5 hover:text-[#ffb4ab] transition-colors"
                  >
                    <X className="w-3 h-3 text-[#c8c4d9]" />
                  </button>
                </div>
              ))}

              {/* Add Date Picker Input */}
              <label className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#252233] border border-[#3a374c] hover:border-[#5a45ff]/60 text-[#5a45ff] text-xs font-medium cursor-pointer transition-colors">
                <Plus className="w-3.5 h-3.5" />
                <span>Add Date</span>
                <input
                  type="date"
                  value={dateInputValue}
                  onChange={handleAddDate}
                  className="sr-only"
                />
              </label>
            </div>

            {selectedDates.length === 0 && (
              <p className="text-[11px] text-[#6b687c]">
                No dates added yet. Tap 'Add Date' to select specific reminder dates.
              </p>
            )}
          </div>
        )}

        {/* Live Active Schedule Box */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[#252233]/70 border border-[#333140]">
          <Repeat className="w-4 h-4 text-[#5a45ff] flex-shrink-0" />
          <span className="text-xs font-medium text-white truncate">
            Schedule: {currentSummary}
          </span>
        </div>

        {/* Actions: No Repeat & Confirm */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleNoRepeat}
            className="flex-1 py-2.5 rounded-xl border border-[#3a374c] hover:bg-[#252233] text-xs font-semibold text-[#c8c4d9] transition-colors"
          >
            No Repeat
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-[#5a45ff] hover:bg-[#6b58ff] text-xs font-bold text-[#130067] shadow-lg shadow-[#5a45ff]/20 transition-all active:scale-[0.98]"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
