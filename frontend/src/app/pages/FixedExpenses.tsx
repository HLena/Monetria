import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Edit2, CalendarClock, PauseCircle } from 'lucide-react';
import {
  useFinance,
  formatCurrency,
} from '../store/FinanceContext';
import {
  EXPENSE_CATEGORIES,
  FixedExpense,
  FixedExpensePeriod,
  fixedExpenseMonthlyEquivalent,
} from '../types/finance';
import { Modal } from '../components/Modal';
import { CategoryIconCircle } from '../lib/categoryIcons';
import { useFinanceStore } from '../store/FinanceStore';

const PERIOD_LABEL: Record<FixedExpensePeriod, string> = {
  monthly: 'Mensual',
  weekly: 'Semanal',
  yearly: 'Anual',
};

function FixedExpenseForm({
  initial,
  accounts,
  onSave,
  onClose,
}: {
  initial?: FixedExpense;
  accounts: { id: string; name: string }[];
  onSave: (data: Omit<FixedExpense, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    amount: initial?.amount || 0,
    category: initial?.category || EXPENSE_CATEGORIES[0],
    accountId: initial?.accountId || accounts[0]?.id || '',
    period: (initial?.period || 'monthly') as FixedExpensePeriod,
    dueDay: initial?.dueDay ?? '' as number | '',
    isActive: initial?.isActive ?? true,
    notes: initial?.notes || '',
  });

  const set = (key: keyof typeof form, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: form.name.trim(),
      amount: parseFloat(String(form.amount)) || 0,
      category: form.category,
      accountId: form.accountId,
      period: form.period,
      dueDay:
        form.dueDay === '' || Number.isNaN(Number(form.dueDay))
          ? undefined
          : Number(form.dueDay),
      isActive: form.isActive,
      notes: form.notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1 block">Nombre *</label>
        <input
          required
          className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Ej: Renta, luz, seguro"
          value={form.name}
          onChange={e => set('name', e.target.value)}
        />
      </div>

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
          <label className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1 block">Monto (MXN) *</label>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.amount || ''}
            onChange={e => set('amount', e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1 block">Cuenta *</label>
          <select
            required
            className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.accountId}
            onChange={e => set('accountId', e.target.value)}
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1 block">Periodo *</label>
          <select
            required
            className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.period}
            onChange={e => set('period', e.target.value as FixedExpensePeriod)}
          >
            <option value="monthly">Mensual</option>
            <option value="weekly">Semanal</option>
            <option value="yearly">Anual</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1 block">Día de cargo (1–31)</label>
          <input
            type="number"
            min={1}
            max={31}
            className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Opcional"
            value={form.dueDay === '' ? '' : form.dueDay}
            onChange={e => set('dueDay', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={e => set('isActive', e.target.checked)}
          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        Activo (incluir en totales)
      </label>

      <div>
        <label className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1 block">Notas</label>
        <input
          className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Opcional"
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          {initial ? 'Guardar' : 'Agregar'}
        </button>
      </div>
    </form>
  );
}

export function FixedExpenses() {
  const {
    accounts,
    fixedExpenses,
  } = useFinanceStore();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<FixedExpense | null>(null);

  const { monthlyTotal, activeCount } = useMemo(() => {
    const active = fixedExpenses.filter(f => f.isActive);
    const monthlyTotal = active.reduce(
      (sum, f) => sum + fixedExpenseMonthlyEquivalent(f.amount, f.period),
      0
    );
    return { monthlyTotal, activeCount: active.length };
  }, [fixedExpenses]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-slate-800 dark:text-slate-100 text-2xl font-bold flex items-center gap-2">
            <CalendarClock className="w-7 h-7 text-indigo-500" />
            Gastos fijos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Compromisos recurrentes (equivalente mensual estimado)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
        >
          <Plus className="w-4 h-4" />
          Nuevo gasto fijo
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900">
          <p className="text-indigo-600 dark:text-indigo-400 text-sm">Equivalente mensual</p>
          <p className="text-indigo-700 dark:text-indigo-300 text-2xl font-bold mt-1">{formatCurrency(monthlyTotal)}</p>
          <p className="text-indigo-500 dark:text-indigo-500/80 text-xs mt-1">{activeCount} activo{activeCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
          <p className="text-slate-600 dark:text-slate-400 text-sm">Total registros</p>
          <p className="text-slate-800 dark:text-slate-100 text-2xl font-bold mt-1">{fixedExpenses.length}</p>
          <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">Incluye pausados</p>
        </div>
      </div>

      {fixedExpenses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center shadow-sm border border-slate-100 dark:border-slate-800">
          <CalendarClock className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400">No hay gastos fijos</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Agrega renta, servicios o suscripciones</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-4 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Agregar el primero
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
          {fixedExpenses.map(item => {
            const account = accounts.find(a => a.id === item.accountId);
            const monthlyEq = fixedExpenseMonthlyEquivalent(item.amount, item.period);
            return (
              <div
                key={item.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 transition-colors ${
                  item.isActive ? 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50' : 'opacity-70 bg-slate-50/50 dark:bg-slate-950/30'
                }`}
              >
                <CategoryIconCircle category={item.category} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-slate-800 dark:text-slate-100 font-semibold">{item.name}</p>
                    {!item.isActive && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md">
                        <PauseCircle className="w-3 h-3" /> Pausado
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                    {item.category} · {PERIOD_LABEL[item.period]}
                    {item.dueDay != null ? ` · día ${item.dueDay}` : ''}
                    {account && ` · ${account.name}`}
                  </p>
                  {item.notes && (
                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">{item.notes}</p>
                  )}
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 sm:gap-1">
                  <div className="text-right">
                    <p className="text-slate-800 dark:text-slate-100 font-semibold">{formatCurrency(item.amount)}</p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs">~{formatCurrency(monthlyEq)}/mes</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEditItem(item)}
                      className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {}}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nuevo gasto fijo">
        <FixedExpenseForm
          accounts={accounts}
          onSave={() => {}}
          onClose={() => setShowForm(false)}
        />
      </Modal>
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Editar gasto fijo">
        {editItem && (
          <FixedExpenseForm
            initial={editItem}
            accounts={accounts}
            onSave={() => {}}
            onClose={() => setEditItem(null)}
          />
        )}
      </Modal>
    </div>
  );
}
