import React from 'react';

interface Props {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}

export function ToggleSwitch({ value, onChange, label, description }: Props) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
        {description && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          value ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
