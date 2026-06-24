import React, { useState } from 'react';
import { SavingsGoal } from '../../types/finance';
import { formatCurrency } from '../../store/FinanceContext';

export function AddToGoalModal({
  goal,
  onUpdate,
  onClose,
}: {
  goal: SavingsGoal;
  onUpdate: (amount: number) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (n > 0) {
      onUpdate(Math.min(goal.currentAmount + n, goal.targetAmount));
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-slate-500 dark:text-slate-400 text-sm">
        Agregar dinero a: <strong className="text-slate-700 dark:text-slate-200">{goal.name}</strong>
      </p>
      <div>
        <label className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1 block">
          Cantidad a agregar (MXN)
        </label>
        <input
          required
          type="number"
          min="1"
          className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="1000"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          autoFocus
        />
        <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
          Pendiente: {formatCurrency(goal.targetAmount - goal.currentAmount)}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          Agregar
        </button>
      </div>
    </form>
  );
}
