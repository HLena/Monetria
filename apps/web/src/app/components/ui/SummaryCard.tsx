type ColorVariant = 'emerald' | 'rose' | 'indigo';

const VARIANTS: Record<ColorVariant, { bg: string; border: string; label: string; value: string }> = {
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-100 dark:border-emerald-900',
    label: 'text-emerald-600 dark:text-emerald-400',
    value: 'text-emerald-700 dark:text-emerald-300',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-100 dark:border-rose-900',
    label: 'text-rose-600 dark:text-rose-400',
    value: 'text-rose-700 dark:text-rose-300',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    border: 'border-indigo-100 dark:border-indigo-900',
    label: 'text-indigo-600 dark:text-indigo-400',
    value: 'text-indigo-700 dark:text-indigo-300',
  },
};

export function SummaryCard({
  label,
  value,
  colorVariant,
  valueClassName,
}: {
  label: string;
  value: string;
  colorVariant: ColorVariant;
  valueClassName?: string;
}) {
  const c = VARIANTS[colorVariant];
  return (
    <div className={`${c.bg} rounded-2xl p-4 border ${c.border}`}>
      <p className={`${c.label} text-xs`}>{label}</p>
      <p className={`${valueClassName ?? c.value} text-xl font-bold mt-0.5`}>{value}</p>
    </div>
  );
}
