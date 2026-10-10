import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { TaskSort } from '../types/task';

interface SortModalProps {
  isOpen: boolean;
  initialSort: TaskSort;
  onApplySort: (sort: TaskSort) => void;
  onClose: () => void;
}

const SORT_OPTIONS: { category: string; options: { label: string; value: TaskSort }[] }[] = [
  {
    category: 'Due Date',
    options: [
      { label: 'Earliest First', value: 'DATE_NEAR' },
      { label: 'Latest First', value: 'DATE_LATE' },
    ],
  },
  {
    category: 'Priority',
    options: [
      { label: 'Highest First', value: 'PRIORITY_HIGH' },
      { label: 'Lowest First', value: 'PRIORITY_LOW' },
    ],
  },
  {
    category: 'Alphabetical',
    options: [
      { label: 'A to Z', value: 'TITLE_AZ' },
      { label: 'Z to A', value: 'TITLE_ZA' },
    ],
  },
];

export const SortModal: React.FC<SortModalProps> = ({
  isOpen,
  initialSort,
  onApplySort,
  onClose,
}) => {
  const [selectedSort, setSelectedSort] = useState<TaskSort>(initialSort);

  useEffect(() => {
    if (isOpen) {
      setSelectedSort(initialSort);
    }
  }, [isOpen, initialSort]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplySort(selectedSort);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-entrance">
      <div className="bg-[#1a1b22] border border-[#292931] rounded-3xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-1 border-b border-[#292931]">
          <h2 className="text-xl font-bold text-white font-display">Sort Tasks</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#c8c4d9] hover:text-white hover:bg-[#292931] transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {SORT_OPTIONS.map((cat) => (
            <div key={cat.category} className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold tracking-wider text-[#918ea2] uppercase font-mono">
                {cat.category}
              </span>
              <div className="flex flex-col gap-1 bg-[#12131a] p-1.5 rounded-2xl border border-[#292931]">
                {cat.options.map((opt) => {
                  const isSelected = selectedSort === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedSort(opt.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-[#5a45ff]/20 text-white font-bold border border-[#5a45ff]/40'
                          : 'text-[#c8c4d9] hover:bg-[#1e1f26]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#5a45ff]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleApply}
            className="w-full h-12 rounded-2xl bg-[#5a45ff] hover:bg-[#6e5aff] text-white font-bold text-sm shadow-xl shadow-[#5a45ff]/25 transition-all active:scale-95"
          >
            Apply Sort
          </button>
        </div>
      </div>
    </div>
  );
};
