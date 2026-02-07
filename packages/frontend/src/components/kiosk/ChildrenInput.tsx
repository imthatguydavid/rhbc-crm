import { Plus, X } from 'lucide-react';

interface Child {
  id: string;
  firstName: string;
}

interface ChildrenInputProps {
  children: Child[];
  onChange: (children: Child[]) => void;
}

export function ChildrenInput({ children, onChange }: ChildrenInputProps) {
  const addChild = () => {
    const newChild: Child = {
      id: `temp-${Date.now()}`,
      firstName: '',
    };
    onChange([...children, newChild]);
  };

  const removeChild = (id: string) => {
    onChange(children.filter((child) => child.id !== id));
  };

  const updateChild = (id: string, firstName: string) => {
    onChange(children.map((child) => (child.id === id ? { ...child, firstName } : child)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-2xl font-semibold text-slate-900">Children</label>
        <button
          type="button"
          onClick={addChild}
          className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Child
        </button>
      </div>

      <div className="space-y-3">
        {children.map((child, index) => (
          <div key={child.id} className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={`Child ${index + 1} first name`}
                value={child.firstName}
                onChange={(e) => updateChild(child.id, e.target.value)}
                className="w-full text-2xl py-4 px-6 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
            {children.length > 1 && (
              <button
                type="button"
                onClick={() => removeChild(child.id)}
                className="p-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        ))}
      </div>

      {children.length === 0 && (
        <div className="text-center py-8 bg-slate-50 rounded-xl">
          <p className="text-xl text-slate-500">Click "Add Child" to add children</p>
        </div>
      )}
    </div>
  );
}
