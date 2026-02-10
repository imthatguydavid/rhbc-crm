interface Parent {
  personId: string;
  firstName: string;
}

interface ParentSelectorProps {
  parents: Parent[];
  lastName: string;
  onSelect: (name: string) => void;
  onCancel: () => void;
}

export function ParentSelector({ parents, lastName, onSelect, onCancel }: ParentSelectorProps) {
  return (
    <div className="max-w-lg mx-auto">
      <h3 className="text-3xl font-semibold text-slate-900 mb-8 text-center">Who's picking up?</h3>

      <div className="space-y-4 mb-8">
        {parents.map((parent) => (
          <button
            key={parent.personId}
            onClick={() => onSelect(`${parent.firstName} ${lastName}`)}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-3xl font-semibold py-8 rounded-2xl shadow-lg transition-colors"
          >
            {parent.firstName} {lastName}
          </button>
        ))}

        <button
          onClick={() => onSelect('other')}
          className="w-full bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-700 text-2xl font-semibold py-6 rounded-2xl transition-colors"
        >
          Someone Else
        </button>
      </div>

      <button
        onClick={onCancel}
        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xl font-medium py-4 rounded-xl transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
