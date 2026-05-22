import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import { Transaction, TransactionType } from '../../types/finance';
import { CategoryIconCircle } from '../../lib/categoryIcons';
import { useFinanceStore } from '../../store/FinanceStore';
import type { CategoryDto } from '../../types/api/categories';

const inputCls =
  'w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400';
const labelCls = 'text-sm text-slate-600 dark:text-slate-400 font-medium mb-1 block';

export function TransactionForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Transaction;
  onSave: (data: Omit<Transaction, 'id' | 'createdAt'>) => void | Promise<void>;
  onClose: () => void;
}) {
  const { accounts, categories } = useFinanceStore();
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initial?.categoryId ?? '');
  const [form, setForm] = useState({
    accountId: initial?.accountId ?? accounts[0]?.id ?? '',
    transferAccountId: initial?.transferAccountId ?? '',
    amount: initial?.amount ?? 0,
    description: initial?.description ?? '',
    date: initial?.date ?? new Date().toISOString().split('T')[0],
  });

  const isEditMode = Boolean(initial);

  // Sync accountId when accounts load after the component mounts (race condition on first open)
  useEffect(() => {
    if (!form.accountId && accounts.length > 0) {
      setForm(prev => ({ ...prev, accountId: accounts[0].id }));
    }
  }, [accounts, form.accountId]);

  const visibleCategories: CategoryDto[] = categories.filter(
    c => c.isActive && c.type === (type === 'expense' ? 'Expense' : 'Income'),
  );

  const selectedCategory =
    visibleCategories.find(c => c.id === selectedCategoryId) ?? visibleCategories[0];

  const destinationAccounts = accounts.filter(a => a.id !== form.accountId);

  const set = (key: keyof typeof form, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleTypeChange = (next: TransactionType) => {
    setType(next);
    setSelectedCategoryId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: Omit<Transaction, 'id' | 'createdAt'> = {
      accountId: form.accountId,
      type,
      category: type === 'transfer' ? 'Transferencia' : (selectedCategory?.name ?? ''),
      categoryId: type === 'transfer' ? undefined : selectedCategory?.id,
      categoryColor: type === 'transfer' ? undefined : (selectedCategory?.color ?? undefined),
      categoryKeyIcon: type === 'transfer' ? undefined : (selectedCategory?.keyIcon ?? undefined),
      amount: parseFloat(form.amount.toString()) || 0,
      description: form.description,
      date: form.date,
      ...(type === 'transfer' && { transferAccountId: form.transferAccountId }),
    };
    setIsSubmitting(true);
    try {
      await onSave(data);
      onClose();
    } catch {
      /* el store persiste el error en el banner de la página */
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitColor =
    type === 'expense'
      ? 'bg-rose-500 hover:bg-rose-600'
      : type === 'income'
      ? 'bg-emerald-500 hover:bg-emerald-600'
      : 'bg-indigo-500 hover:bg-indigo-600';

  const submitLabel = isSubmitting
    ? 'Guardando…'
    : initial
    ? 'Guardar cambios'
    : type === 'expense'
    ? 'Agregar gasto'
    : type === 'income'
    ? 'Agregar ingreso'
    : 'Agregar transferencia';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type toggle — disabled in edit mode since type is immutable */}
      <div
        className={`flex rounded-xl border border-slate-200 dark:border-slate-600 p-1 gap-1 ${
          isEditMode ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        <button
          type="button"
          onClick={() => handleTypeChange('expense')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            type === 'expense'
              ? 'bg-rose-500 text-white'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <TrendingDown className="w-4 h-4" /> Gasto
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('income')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            type === 'income'
              ? 'bg-emerald-500 text-white'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Ingreso
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('transfer')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            type === 'transfer'
              ? 'bg-indigo-500 text-white'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" /> Transferencia
        </button>
      </div>

      {/* Category grid — hidden for transfers */}
      {type !== 'transfer' && (
        <div>
          <label className={`${labelCls} mb-2`}>Categoría *</label>
          {visibleCategories.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">Cargando categorías…</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-1">
              {visibleCategories.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(c.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-all ${
                    selectedCategory?.id === c.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 ring-1 ring-indigo-500'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <CategoryIconCircle iconKey={c.keyIcon} color={c.color ?? undefined} size="sm" />
                  <span className="text-slate-600 dark:text-slate-300 text-center leading-tight line-clamp-2">
                    {c.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelCls}>{type === 'transfer' ? 'Cuenta origen *' : 'Cuenta *'}</label>
          <select
            required
            className={`${inputCls} bg-white`}
            value={form.accountId}
            onChange={e => set('accountId', e.target.value)}
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {type === 'transfer' && (
          <div className="col-span-2">
            <label className={labelCls}>Cuenta destino *</label>
            <select
              required
              className={`${inputCls} bg-white`}
              value={form.transferAccountId}
              onChange={e => set('transferAccountId', e.target.value)}
            >
              <option value="">Selecciona cuenta destino</option>
              {destinationAccounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={labelCls}>Monto *</label>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            className={inputCls}
            placeholder="0.00"
            value={form.amount || ''}
            onChange={e => set('amount', e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Fecha *</label>
          <input
            required
            type="date"
            className={inputCls}
            value={form.date}
            onChange={e => set('date', e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Descripción</label>
          <input
            className={inputCls}
            placeholder="Ej: Supermercado La Comer"
            value={form.description}
            onChange={e => set('description', e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`flex-1 text-white rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-70 ${submitColor}`}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
