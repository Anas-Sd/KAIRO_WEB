import React, { useState } from 'react';
import { X, FolderTree, Search, Check, Home } from 'lucide-react';
import { Task } from '../types/task';

interface AdjustParentModalProps {
  task: Task | null;
  allTasks: Task[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newParentId: string | null, moveSubtasks: Boolean) => void;
}

export const AdjustParentModal: React.FC<AdjustParentModalProps> = ({
  task,
  allTasks,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [search, setSearch] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(
    task ? task.parentId ?? null : null
  );
  const [moveSubtasks, setMoveSubtasks] = useState(true);

  if (!isOpen || !task) return null;

  // Helper: Find all descendant IDs to prevent cyclical references
  const getDescendantIds = (rootId: string): Set<string> => {
    const descendants = new Set<string>();
    const stack = [rootId];
    while (stack.length > 0) {
      const current = stack.pop()!;
      const children = allTasks.filter((t) => t.parentId === current);
      children.forEach((c) => {
        if (!descendants.has(c.id)) {
          descendants.add(c.id);
          stack.push(c.id);
        }
      });
    }
    return descendants;
  };

  const invalidParentIds = getDescendantIds(task.id);
  invalidParentIds.add(task.id); // Cannot be parent of itself

  const candidateParents = allTasks
    .filter((t) => !invalidParentIds.has(t.id))
    .filter(
      (t) =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.notes && t.notes.toLowerCase().includes(search.toLowerCase()))
    );

  const handleConfirm = () => {
    onConfirm(selectedParentId, moveSubtasks);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-entrance">
      <div className="bg-[#1a1b22] border border-[#292931] rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh]">
        <div className="flex items-center justify-between pb-2 border-b border-[#292931]">
          <div className="flex flex-col">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-[#ffb77d]" />
              Adjust Parent / Move Task
            </h3>
            <span className="text-xs text-[#918ea2] mt-0.5">
              Moving: <strong className="text-white">{task.title}</strong>
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#918ea2] hover:text-white p-1 rounded-lg transition-colors active:scale-90"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#918ea2] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search potential parent tasks..."
            className="w-full bg-[#12131a] border border-[#292931] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-[#918ea2] focus:border-[#5a45ff] outline-none transition-all"
          />
        </div>

        {/* Options List */}
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-1">
          {/* Root Option */}
          <div
            onClick={() => setSelectedParentId(null)}
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
              selectedParentId === null
                ? 'bg-[#5a45ff]/20 border-[#5a45ff] text-white'
                : 'bg-[#12131a] border-[#292931] hover:border-[#474556] text-[#c8c4d9]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Home className="w-4 h-4 text-[#00f5a0]" />
              <div>
                <p className="text-xs font-semibold">No Parent (Top-Level Task)</p>
                <p className="text-[11px] text-[#918ea2]">
                  Place directly on the root tasks workspace
                </p>
              </div>
            </div>
            {selectedParentId === null && <Check className="w-4 h-4 text-[#00f5a0]" />}
          </div>

          {/* Candidate Parent Tasks */}
          {candidateParents.map((candidate) => {
            const isSelected = selectedParentId === candidate.id;
            return (
              <div
                key={candidate.id}
                onClick={() => setSelectedParentId(candidate.id)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#5a45ff]/20 border-[#5a45ff] text-white'
                    : 'bg-[#12131a] border-[#292931] hover:border-[#474556] text-[#c8c4d9]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FolderTree className="w-4 h-4 text-[#c5c0ff] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{candidate.title}</p>
                    <p className="text-[10px] text-[#918ea2]">
                      Section: {candidate.section} • Priority: {candidate.priority}
                    </p>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#5a45ff] flex-shrink-0" />}
              </div>
            );
          })}

          {candidateParents.length === 0 && search && (
            <p className="text-center text-xs text-[#918ea2] py-4">No matching tasks found</p>
          )}
        </div>

        {/* Move Subtasks Toggle */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#292931]">
          <input
            type="checkbox"
            id="moveSubtasksCheck"
            checked={moveSubtasks}
            onChange={(e) => setMoveSubtasks(e.target.checked)}
            className="rounded bg-[#12131a] border-[#474556] text-[#5a45ff] focus:ring-0"
          />
          <label htmlFor="moveSubtasksCheck" className="text-xs text-[#c8c4d9] cursor-pointer">
            Move this task together with all of its existing subtasks
          </label>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#292931]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#c8c4d9] hover:bg-[#292931] transition-colors active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#5a45ff] hover:bg-[#6e5aff] text-white transition-all shadow-md shadow-[#5a45ff]/25 active:scale-95"
          >
            Confirm Move
          </button>
        </div>
      </div>
    </div>
  );
};
