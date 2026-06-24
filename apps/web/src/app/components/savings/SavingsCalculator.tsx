import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { formatCurrency } from '../../store/FinanceContext';

export function SavingsCalculator() {
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [months, setMonths] = useState('');
  const [monthly, setMonthly] = useState('');
  const [mode, setMode] = useState<'months' | 'monthly'>('monthly');

  const targetNum = parseFloat(target) || 0;
  const currentNum = parseFloat(current) || 0;
  const remaining = Math.max(0, targetNum - currentNum);

  const result = (() => {
    if (!targetNum) return null;
    if (mode === 'monthly' && months) {
      const m = parseFloat(months);
      if (m > 0) return remaining / m;
    }
    if (mode === 'months' && monthly) {
      const mo = parseFloat(monthly);
      if (mo > 0) return Math.ceil(remaining / mo);
    }
    return null;
  })();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-5">
        <Calculator className="w-5 h-5 text-indigo-500" />
        <h2 className="text-slate-700 dark:text-slate-200 font-semibold">Calculadora de Ahorro</h2>
      </div>

      <div className="flex gap-2 mb-5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        <button
          onClick={() => setMode('monthly')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'monthly' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
        >
          ¿Cuánto ahorrar?
        </button>
        <button
          onClick={() => setMode('months')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'months' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
        >
          ¿Cuánto tiempo?
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Meta ($)</label>
            <input
              type="number"
              min="0"
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="50,000"
              value={target}
              onChange={e => setTarget(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Ya tengo ($)</label>
            <input
              type="number"
              min="0"
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="0"
              value={current}
              onChange={e => setCurrent(e.target.value)}
            />
          </div>
        </div>

        {mode === 'monthly' ? (
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">¿En cuántos meses?</label>
            <input
              type="number"
              min="1"
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="12"
              value={months}
              onChange={e => setMonths(e.target.value)}
            />
          </div>
        ) : (
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Ahorro mensual ($)</label>
            <input
              type="number"
              min="1"
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="3,000"
              value={monthly}
              onChange={e => setMonthly(e.target.value)}
            />
          </div>
        )}

        {remaining > 0 && (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm">
            <p className="text-slate-400 dark:text-slate-500 text-xs">Pendiente por ahorrar</p>
            <p className="text-slate-700 dark:text-slate-200 font-bold">{formatCurrency(remaining)}</p>
          </div>
        )}

        {result !== null && result > 0 && (
          <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-4 text-center border border-indigo-100 dark:border-indigo-900">
            <p className="text-indigo-500 dark:text-indigo-400 text-xs mb-1">
              {mode === 'monthly' ? 'Debes ahorrar mensualmente:' : 'Lo lograrás en:'}
            </p>
            <p className="text-indigo-700 dark:text-indigo-300 text-2xl font-bold">
              {mode === 'monthly'
                ? formatCurrency(result)
                : `${result} mes${result !== 1 ? 'es' : ''}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
