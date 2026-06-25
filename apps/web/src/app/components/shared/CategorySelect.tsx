import { useState, useRef, useEffect, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { CategoryIconCircle } from '../../lib/categoryIcons';

export interface CategoryOption {
  id: string;
  name: string;
  iconKey?: string | null;
  color?: string | null;
}

interface Props {
  options: CategoryOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}

const triggerCls =
  'w-full flex items-center gap-2 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500 transition-colors';

export function CategorySelect({ options, value, onChange, placeholder = 'Selecciona categoría' }: Props) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.id === value);

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
      });
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    const handleOut = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOut);
    return () => document.removeEventListener('mousedown', handleOut);
  }, []);

  return (
    <div className="relative">
      <button ref={triggerRef} type="button" onClick={handleOpen} className={triggerCls}>
        {selected ? (
          <CategoryIconCircle iconKey={selected.iconKey} category={selected.name} color={selected.color ?? undefined} size="xs" />
        ) : null}
        <span className={`flex-1 text-left ${selected ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
          {selected?.name ?? placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg max-h-52 overflow-y-auto"
        >
          {options.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => { onChange(opt.id); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                opt.id === value
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <CategoryIconCircle iconKey={opt.iconKey} category={opt.name} color={opt.color ?? undefined} size="xs" />
              <span>{opt.name}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
