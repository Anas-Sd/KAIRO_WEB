import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { FilterCriteria, StatusFilter, Priority, DateFilter } from '../types/task';

interface FilterModalProps {
  isOpen: boolean;
  initialFilter: FilterCriteria;
  onApplyFilter: (criteria: FilterCriteria) => void;
  onClose: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  initialFilter,
  onApplyFilter,
  onClose,
}) => {
  const [tempStatuses, setTempStatuses] = useState<StatusFilter[]>([]);
  const [tempPriorities, setTempPriorities] = useState<Priority[]>([]);
  const [tempDate, setTempDate] = useState<DateFilter | null>(null);
  const [tempRangeStart, setTempRangeStart] = useState<number | null>(null);
  const [tempRangeEnd, setTempRangeEnd] = useState<number | null>(null);
  const [showRangeInputs, setShowRangeInputs] = useState(false);

  const [rangeStartStr, setRangeStartStr] = useState('');
  const [rangeEndStr, setRangeEndStr] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTempStatuses(initialFilter.selectedStatuses || []);
      setTempPriorities(initialFilter.selectedPriorities || []);
      setTempDate(initialFilter.selectedDate || null);
      setTempRangeStart(initialFilter.dateRangeStart || null);
      setTempRangeEnd(initialFilter.dateRangeEnd || null);
      setShowRangeInputs(initialFilter.selectedDate === 'RANGE');

      if (initialFilter.dateRangeStart) {
        const d = new Date(initialFilter.dateRangeStart);
        setRangeStartStr(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        );
      } else {
        setRangeStartStr('');
      }

      if (initialFilter.dateRangeEnd) {
        const d = new Date(initialFilter.dateRangeEnd);
        setRangeEndStr(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        );
      } else {
        setRangeEndStr('');
      }
    }
  }, [isOpen, initialFilter]);

  if (!isOpen) return null;

  const handleToggleStatus = (status: StatusFilter) => {
    if (tempStatuses.includes(status)) {
      setTempStatuses(tempStatuses.filter((s) => s !== status));
    } else {
      setTempStatuses([...tempStatuses, status]);
    }
  };

  const handleTogglePriority = (priority: Priority) => {
    if (tempPriorities.includes(priority)) {
      setTempPriorities(tempPriorities.filter((p) => p !== priority));
    } else {
      setTempPriorities([...tempPriorities, priority]);
    }
  };

  const handleToggleDate = (dateFilter: DateFilter) => {
    if (tempDate === dateFilter) {
      setTempDate(null);
      setShowRangeInputs(false);
    } else {
      setTempDate(dateFilter);
      if (dateFilter === 'RANGE') {
        setShowRangeInputs(true);
      } else {
        setShowRangeInputs(false);
      }
    }
  };

  const handleReset = () => {
    const emptyCriteria: FilterCriteria = {
      selectedStatuses: [],
      selectedPriorities: [],
      selectedDate: null,
      dateRangeStart: null,
      dateRangeEnd: null,
    };
    onApplyFilter(emptyCriteria);
    onClose();
  };

  const handleApply = () => {
    let startMillis = tempRangeStart;
    let endMillis = tempRangeEnd;

    if (tempDate === 'RANGE') {
      if (rangeStartStr) {
        const p = rangeStartStr.split('-');
        if (p.length === 3) {
          startMillis = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 0, 0, 0, 0).getTime();
        }
      }
      if (rangeEndStr) {
        const p = rangeEndStr.split('-');
        if (p.length === 3) {
          endMillis = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 23, 59, 59, 999).getTime();
        }
      }
    }

    onApplyFilter({
      selectedStatuses: tempStatuses,
      selectedPriorities: tempPriorities,
      selectedDate: tempDate,
      dateRangeStart: tempDate === 'RANGE' ? startMillis : null,
      dateRangeEnd: tempDate === 'RANGE' ? endMillis : null,
    });
    onClose();
  };

  const getRangeLabel = () => {
    if (tempDate === 'RANGE' && tempRangeStart && tempRangeEnd) {
      const s = new Date(tempRangeStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const e = new Date(tempRangeEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${s} - ${e}`;
    }
    return 'Range';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-entrance">
      <div className="bg-[#1a1b22] border border-[#292931] rounded-3xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-6 max-h-[92vh] overflow-y-auto">
        {/* Header Row: Title & Reset Button */}
        <div className="flex items-center justify-between pb-1 border-b border-[#292931]">
          <h2 className="text-xl font-bold text-white font-display">Filter Tasks</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-[#5a45ff] hover:text-[#6e5aff] transition-colors py-1 px-2"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-[#c8c4d9] hover:text-white hover:bg-[#292931] transition-colors"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 1. STATUS SECTION */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-bold tracking-wider text-[#918ea2] uppercase font-mono">
            STATUS
          </span>
          <div className="flex items-center gap-2.5 flex-wrap">
            {(['ACTIVE', 'COMPLETED'] as StatusFilter[]).map((st) => {
              const isSelected = tempStatuses.includes(st);
              const label = st === 'ACTIVE' ? 'Active' : 'Completed';
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleToggleStatus(st)}
                  className={`px-4 py-2 rounded-2xl text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-[#5a45ff] border-[#5a45ff] text-white font-bold shadow-md shadow-[#5a45ff]/20'
                      : 'bg-[#12131a] border-[#292931] text-[#c8c4d9] hover:border-[#5a45ff]/40'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. PRIORITY SECTION */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-bold tracking-wider text-[#918ea2] uppercase font-mono">
            PRIORITY
          </span>
          <div className="flex items-center gap-2.5 flex-wrap">
            {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as Priority[]).map((pr) => {
              const isSelected = tempPriorities.includes(pr);
              const label = pr === 'LOW' ? 'Low' : pr === 'MEDIUM' ? 'Med' : pr === 'HIGH' ? 'High' : 'Urgent';
              return (
                <button
                  key={pr}
                  type="button"
                  onClick={() => handleTogglePriority(pr)}
                  className={`px-4 py-2 rounded-2xl text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-[#5a45ff] border-[#5a45ff] text-white font-bold shadow-md shadow-[#5a45ff]/20'
                      : 'bg-[#12131a] border-[#292931] text-[#c8c4d9] hover:border-[#5a45ff]/40'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. DUE DATE SECTION */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-bold tracking-wider text-[#918ea2] uppercase font-mono">
            DUE DATE
          </span>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleToggleDate('TODAY')}
              className={`px-4 py-2 rounded-2xl text-xs font-medium border transition-all ${
                tempDate === 'TODAY'
                  ? 'bg-[#5a45ff] border-[#5a45ff] text-white font-bold shadow-md shadow-[#5a45ff]/20'
                  : 'bg-[#12131a] border-[#292931] text-[#c8c4d9] hover:border-[#5a45ff]/40'
              }`}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => handleToggleDate('TOMORROW')}
              className={`px-4 py-2 rounded-2xl text-xs font-medium border transition-all ${
                tempDate === 'TOMORROW'
                  ? 'bg-[#5a45ff] border-[#5a45ff] text-white font-bold shadow-md shadow-[#5a45ff]/20'
                  : 'bg-[#12131a] border-[#292931] text-[#c8c4d9] hover:border-[#5a45ff]/40'
              }`}
            >
              Tomorrow
            </button>

            <button
              type="button"
              onClick={() => handleToggleDate('RANGE')}
              className={`px-4 py-2 rounded-2xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                tempDate === 'RANGE'
                  ? 'bg-[#5a45ff] border-[#5a45ff] text-white font-bold shadow-md shadow-[#5a45ff]/20'
                  : 'bg-[#12131a] border-[#292931] text-[#c8c4d9] hover:border-[#5a45ff]/40'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{getRangeLabel()}</span>
            </button>
          </div>

          {/* Range Picker Inputs */}
          {showRangeInputs && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#12131a] border border-[#292931] rounded-2xl animate-entrance mt-1">
              <div>
                <label className="text-[10px] text-[#918ea2] block mb-1">Start Date</label>
                <input
                  type="date"
                  value={rangeStartStr}
                  onChange={(e) => setRangeStartStr(e.target.value)}
                  className="w-full bg-[#1a1b22] border border-[#33343c] rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#5a45ff]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#918ea2] block mb-1">End Date</label>
                <input
                  type="date"
                  value={rangeEndStr}
                  onChange={(e) => setRangeEndStr(e.target.value)}
                  className="w-full bg-[#1a1b22] border border-[#33343c] rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#5a45ff]"
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. APPLY FILTERS BUTTON */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleApply}
            className="w-full h-12 rounded-2xl bg-[#5a45ff] hover:bg-[#6e5aff] text-white font-bold text-sm shadow-xl shadow-[#5a45ff]/25 transition-all active:scale-95"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
