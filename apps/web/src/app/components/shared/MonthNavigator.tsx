import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

interface MonthNavigatorProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export function MonthNavigator({ month, year, onChange }: MonthNavigatorProps) {
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  function prev() {
    if (month === 1) onChange(12, year - 1);
    else onChange(month - 1, year);
  }

  function next() {
    if (isCurrentMonth) return;
    if (month === 12) onChange(1, year + 1);
    else onChange(month + 1, year);
  }

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl px-1 py-1">
      <button
        onClick={prev}
        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors"
        aria-label="Mes anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 min-w-[130px] text-center select-none">
        {MONTH_NAMES[month - 1]} {year}
      </span>

      <button
        onClick={next}
        disabled={isCurrentMonth}
        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:pointer-events-none"
        aria-label="Mes siguiente"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
