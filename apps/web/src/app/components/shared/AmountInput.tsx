import React from 'react';
import { Currency } from '../../types/finance';

interface Props {
  value: number | '';
  onChange: (value: string) => void;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  label?: string;
  min?: string;
  required?: boolean;
}

export function AmountInput({
  value,
  onChange,
  currency,
  onCurrencyChange,
  label = 'Monto',
  min = '0.01',
  required,
}: Props) {
  return (
    <div className="relative flex flex-col items-center py-4 border-b border-slate-100 dark:border-slate-700/50">
      <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
        {label}
      </span>
      <input
        required={required}
        type="number"
        min={min}
        step="0.01"
        className="w-full text-5xl font-bold text-center bg-transparent border-none outline-none focus:outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600"
        placeholder="0.00"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
      <div className="flex items-center rounded-full border border-slate-200 dark:border-slate-600 mt-2 p-0.5 gap-0.5 bg-white dark:bg-slate-800 shadow-sm">
        {(['PEN', 'USD'] as Currency[]).map(c => (
          <button
            key={c}
            type="button"
            onClick={() => onCurrencyChange(c)}
            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
              currency === c
                ? 'bg-indigo-600 text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {c === 'PEN' ? 'S/' : '$'}
          </button>
        ))}
      </div>
    </div>
  );
}
