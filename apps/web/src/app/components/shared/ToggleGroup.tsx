import React from 'react';

export interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

export function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
}: {
  options: ToggleOption<T>[];
  value: T;
  onChange: (val: T) => void;
  size?: 'sm' | 'md';
}) {
  const btnCls = size === 'sm' ? 'py-1.5 text-xs' : 'py-2 text-sm';

  return (
    <div className="flex rounded-xl border border-slate-200 dark:border-slate-600 p-0.5 gap-0.5">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 rounded-lg font-medium transition-all ${btnCls} ${
            value === opt.value
              ? 'bg-indigo-600 text-white'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
