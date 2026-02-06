import { useState } from 'react';
import type { Person } from '@rhbc-crm/shared';

interface ChildSelectorProps {
  children: Person[];
  onConfirm: (selectedIds: string[]) => void;
  onCancel: () => void;
}

export function ChildSelector({ children, onConfirm, onCancel }: ChildSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleChild = (childId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(childId)) {
      newSelected.delete(childId);
    } else {
      newSelected.add(childId);
    }
    setSelectedIds(newSelected);
  };

  const handleConfirm = () => {
    if (selectedIds.size > 0) {
      onConfirm(Array.from(selectedIds));
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-3xl font-semibold text-slate-900">Select children to check in:</h3>

      <div className="space-y-4">
        {children.map((child) => (
          <button
            key={child.personId}
            onClick={() => toggleChild(child.personId)}
            className={`w-full text-left p-6 rounded-2xl border-2 transition-all ${
              selectedIds.has(child.personId)
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Checkbox */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-lg border-2 flex items-center justify-center ${
                  selectedIds.has(child.personId)
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-white border-slate-300'
                }`}
              >
                {selectedIds.has(child.personId) && (
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>

              {/* Child Name */}
              <div className="text-2xl font-medium text-slate-900">{child.firstName}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <button
          onClick={onCancel}
          className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-2xl font-semibold py-6 rounded-2xl transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={selectedIds.size === 0}
          className={`flex-1 text-white text-2xl font-semibold py-6 rounded-2xl transition-colors ${
            selectedIds.size > 0
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-slate-300 cursor-not-allowed'
          }`}
        >
          Check In ({selectedIds.size})
        </button>
      </div>
    </div>
  );
}
