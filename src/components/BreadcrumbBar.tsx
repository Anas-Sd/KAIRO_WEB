import React from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Task } from '../types/task';

interface BreadcrumbBarProps {
  breadcrumbStack: Task[];
  onNavigateBack: () => void;
  onNavigateToCrumb: (index: number) => void;
}

export const BreadcrumbBar: React.FC<BreadcrumbBarProps> = ({
  breadcrumbStack,
  onNavigateBack,
  onNavigateToCrumb,
}) => {
  if (breadcrumbStack.length === 0) return null;

  return (
    <div className="w-full bg-[#1e1f26]/80 border border-[#292931] rounded-xl px-4 py-2.5 flex items-center gap-3 animate-entrance">
      <button
        onClick={onNavigateBack}
        className="p-1.5 rounded-lg hover:bg-[#292931] text-[#c8c4d9] hover:text-white transition-colors active:scale-90 flex items-center justify-center"
        title="Go up one level"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium scrollbar-none">
        <button
          onClick={() => onNavigateToCrumb(-1)}
          className="text-[#c5c0ff] hover:text-white hover:underline transition-colors px-1 py-0.5 rounded whitespace-nowrap"
        >
          All Tasks
        </button>

        {breadcrumbStack.map((crumb, idx) => {
          const isLast = idx === breadcrumbStack.length - 1;
          return (
            <React.Fragment key={crumb.id}>
              <ChevronRight className="w-3.5 h-3.5 text-[#918ea2] flex-shrink-0" />
              <button
                onClick={() => onNavigateToCrumb(idx)}
                disabled={isLast}
                className={`whitespace-nowrap px-1 py-0.5 rounded transition-colors ${
                  isLast
                    ? 'text-white font-bold cursor-default'
                    : 'text-[#c5c0ff] hover:text-white hover:underline'
                }`}
              >
                {crumb.title}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
