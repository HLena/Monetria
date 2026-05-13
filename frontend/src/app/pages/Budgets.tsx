import React, { useState } from 'react';
import { Plus, Trash2, Edit2, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { useFinance, formatCurrency, getCurrentMonthKey, getMonthKey } from '../store/FinanceContext';
import { Budget, EXPENSE_CATEGORIES, CATEGORY_COLORS, BudgetPeriod } from '../types/finance';
import { Modal } from '../components/Modal';
import { CategoryIconCircle } from '../lib/categoryIcons';
import { useFinanceStore } from '../store/FinanceStore';

const BUDGET_COLORS = [
  '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#6366f1',
  '#ef4444', '#06b6d4', '#f97316', '#ec4899', '#84cc16',
];

function BudgetForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Budget;
  onSave: (data: Omit<Budget, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    category: initial?.category || EXPENSE_CATEGORIES[0],
    limit: initial?.limit || 0,
    period: initial?.period || ('monthly' as BudgetPeriod),
    color: initial?.color || BUDGET_COLORS[0],
  });

  const set = (key: keyof typeof form, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, limit: parseFloat(form.limit.toString()) || 0 });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-2 block">Categoría *</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
          {EXPENSE_CATEGORIES.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => set('category', c)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-all ${
                form.category === c
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 ring-1 ring-indigo-500'
                  : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
              }`}
            >
              <CategoryIconCircle category={c} size="sm" />
              <span className="text-slate-600 dark:text-slate-300 text-center leading-tight line-clamp-2">{c}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1 block">Límite (MXN) *</label>
          <input
            required
            type="number"
            min="1"
            step="0.01"
            className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="5000"
            value={form.limit || ''}
            onChange={e => set('limit', e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1 block">Periodo *</label>
          <select
            required
            className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.period}
            onChange={e => set('period', e.target.value as BudgetPeriod)}
          >
            <option value="monthly">Mensual</option>
            <option value="weekly">Semanal</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-2 block">Color</label>
        <div className="flex gap-2 flex-wrap">
          {BUDGET_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => set('color', color)}
              className={`w-8 h-8 rounded-full transition-all dark:ring-offset-slate-900 ${form.color === color ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 scale-110' : ''}`}
              style={{ background: color }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          Cancelar
        </button>
        <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors">
          {initial ? 'Guardar cambios' : 'Crear presupuesto'}
        </button>
      </div>
    </form>
  );
}

interface BudgetWithSpent extends Budget {
  spent: number;
  remaining: number;
  percent: number;
  isOver: boolean;
  isWarning: boolean;
}

export function Budgets() {
  const { budgets, transactions } = useFinanceStore();
  const [showForm, setShowForm] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const currentMonth = getCurrentMonthKey();

  const budgetsWithSpent: BudgetWithSpent[] = budgets.map(b => {
    const spent = transactions
      .filter(t => t.type === 'expense' && t.category === b.category && getMonthKey(t.date) === currentMonth)
      .reduce((sum, t) => sum + t.amount, 0);
    const remaining = Math.max(0, b.limit - spent);
    const percent = Math.min((spent / b.limit) * 100, 100);
    return {
      ...b,
      spent,
      remaining,
      percent,
      isOver: spent > b.limit,
      isWarning: spent > b.limit * 0.8 && spent <= b.limit,
    };
  });

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgetsWithSpent.reduce((sum, b) => sum + b.spent, 0);
  const overBudgetCount = budgetsWithSpent.filter(b => b.isOver).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-slate-800 dark:text-slate-100 text-2xl font-bold">Presupuestos</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Control de gastos por categoría</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
        >
          <Plus className="w-4 h-4" />
          Nuevo Presupuesto
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900">
          <p className="text-indigo-600 dark:text-indigo-400 text-sm">Presupuesto Total</p>
          <p className="text-indigo-700 dark:text-indigo-300 text-2xl font-bold mt-1">{formatCurrency(totalBudget)}</p>
          <p className="text-indigo-500 dark:text-indigo-500/80 text-xs mt-1">{budgets.length} categorías</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950/30 rounded-2xl p-4 border border-rose-100 dark:border-rose-900">
          <p className="text-rose-600 dark:text-rose-400 text-sm">Gastado este mes</p>
          <p className="text-rose-700 dark:text-rose-300 text-2xl font-bold mt-1">{formatCurrency(totalSpent)}</p>
          <p className="text-rose-500 dark:text-rose-500/80 text-xs mt-1">{totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : 0}% del total</p>
        </div>
        <div className={`rounded-2xl p-4 border ${overBudgetCount > 0 ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900' : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900'}`}>
          {overBudgetCount > 0 ? (
            <>
              <p className="text-amber-600 dark:text-amber-400 text-sm flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Excedidos</p>
              <p className="text-amber-700 dark:text-amber-300 text-2xl font-bold mt-1">{overBudgetCount}</p>
              <p className="text-amber-500 dark:text-amber-500/80 text-xs mt-1">categoría{overBudgetCount !== 1 ? 's' : ''} sobre límite</p>
            </>
          ) : (
            <>
              <p className="text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Todo en orden</p>
              <p className="text-emerald-700 dark:text-emerald-300 text-2xl font-bold mt-1">✓</p>
              <p className="text-emerald-500 dark:text-emerald-500/80 text-xs mt-1">Dentro del presupuesto</p>
            </>
          )}
        </div>
      </div>

      {budgets.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center shadow-sm border border-slate-100 dark:border-slate-800">
          <Target className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400">No hay presupuestos configurados</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Crea tu primer presupuesto para controlar tus gastos</p>
          <button onClick={() => setShowForm(true)} className="mt-4 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
            Crear presupuesto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgetsWithSpent.map(budget => (
            <div
              key={budget.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border transition-all ${
                budget.isOver
                  ? 'border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/20'
                  : budget.isWarning
                  ? 'border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/20'
                  : 'border-slate-100 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <CategoryIconCircle category={budget.category} />
                  <div>
                    <p className="text-slate-700 dark:text-slate-200 font-semibold">{budget.category}</p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs capitalize">{budget.period === 'monthly' ? 'Mensual' : 'Semanal'}</p>
                  </div>
                </div>
                {budget.isOver && <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />}
                {budget.isWarning && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                {!budget.isOver && !budget.isWarning && <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Gastado</span>
                  <span className={budget.isOver ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-slate-600 dark:text-slate-300'}>
                    {budget.percent.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(budget.percent, 100)}%`,
                      background: budget.isOver
                        ? '#ef4444'
                        : budget.isWarning
                        ? '#f59e0b'
                        : CATEGORY_COLORS[budget.category] || budget.color,
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <div>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">Gastado</p>
                  <p className={`font-semibold ${budget.isOver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    {formatCurrency(budget.spent)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 dark:text-slate-500 text-xs">{budget.isOver ? 'Excedido' : 'Disponible'}</p>
                  <p className={`font-semibold ${budget.isOver ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {budget.isOver
                      ? `+${formatCurrency(budget.spent - budget.limit)}`
                      : formatCurrency(budget.remaining)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 text-xs">Límite: {formatCurrency(budget.limit)}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditBudget(budget)}
                    className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {}}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nuevo Presupuesto">
        <BudgetForm onSave={() => {}} onClose={() => setShowForm(false)} />
      </Modal>
      <Modal isOpen={!!editBudget} onClose={() => setEditBudget(null)} title="Editar Presupuesto">
        {editBudget && (
          <BudgetForm
            initial={editBudget}
            onSave={() => {}}
            onClose={() => setEditBudget(null)}
          />
        )}
      </Modal>
    </div>
  );
}
