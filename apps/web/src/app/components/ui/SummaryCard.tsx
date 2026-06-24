type ColorVariant = 'emerald' | 'rose' | 'indigo' | 'slate' | 'amber' | 'purple';

const VARIANTS: Record<ColorVariant, { bg: string; border: string; label: string; value: string; description: string }> = {
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-100 dark:border-emerald-900',
    label: 'text-emerald-600 dark:text-emerald-400',
    value: 'text-emerald-700 dark:text-emerald-300',
    description: 'text-emerald-500 dark:text-emerald-500/80',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-100 dark:border-rose-900',
    label: 'text-rose-600 dark:text-rose-400',
    value: 'text-rose-700 dark:text-rose-300',
    description: 'text-rose-500 dark:text-rose-500/80',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    border: 'border-indigo-100 dark:border-indigo-900',
    label: 'text-indigo-600 dark:text-indigo-400',
    value: 'text-indigo-700 dark:text-indigo-300',
    description: 'text-indigo-500 dark:text-indigo-500/80',
  },
  slate: {
    bg: 'bg-slate-50 dark:bg-slate-900/80',
    border: 'border-slate-100 dark:border-slate-800',
    label: 'text-slate-600 dark:text-slate-400',
    value: 'text-slate-800 dark:text-slate-100',
    description: 'text-slate-500 dark:text-slate-500',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-100 dark:border-amber-900',
    label: 'text-amber-600 dark:text-amber-400',
    value: 'text-amber-700 dark:text-amber-300',
    description: 'text-amber-500 dark:text-amber-500/80',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-100 dark:border-purple-900',
    label: 'text-purple-600 dark:text-purple-400',
    value: 'text-purple-700 dark:text-purple-300',
    description: 'text-purple-500 dark:text-purple-500/80',
  },
};

export function SummaryCard({
  label,
  value,
  colorVariant,
  valueClassName,
  description,
}: {
  label: string;
  value: string;
  colorVariant: ColorVariant;
  valueClassName?: string;
  description?: string;
}) {
  const c = VARIANTS[colorVariant];
  return (
    <div className={`${c.bg} rounded-2xl p-4 border ${c.border}`}>
      <p className={`${c.label} text-sm`}>{label}</p>
      <p className={`${valueClassName ?? c.value} text-2xl font-bold mt-1`}>{value}</p>
      {description && <p className={`${c.description} text-xs mt-1`}>{description}</p>}
    </div>
  );
}
