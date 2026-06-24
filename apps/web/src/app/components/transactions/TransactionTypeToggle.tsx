import { TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import { TransactionType } from '../../types/finance';

const OPTIONS: {
  value: TransactionType;
  label: string;
  icon: typeof TrendingDown;
  activeClass: string;
}[] = [
  { value: 'expense',  label: 'Gasto',         icon: TrendingDown,    activeClass: 'bg-rose-500 text-white' },
  { value: 'income',   label: 'Ingreso',        icon: TrendingUp,      activeClass: 'bg-emerald-500 text-white' },
  { value: 'transfer', label: 'Transferencia',  icon: ArrowLeftRight,  activeClass: 'bg-indigo-500 text-white' },
];

const inactiveClass =
  'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200';

export function TransactionTypeToggle({
  value,
  onChange,
  disabled,
}: {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex rounded-xl border border-slate-200 dark:border-slate-600 p-1 gap-1 ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {OPTIONS.map(({ value: opt, label, icon: Icon, activeClass }) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            value === opt ? activeClass : inactiveClass
          }`}
        >
          <Icon className="w-4 h-4" /> {label}
        </button>
      ))}
    </div>
  );
}
