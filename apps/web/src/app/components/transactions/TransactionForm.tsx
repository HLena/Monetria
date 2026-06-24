import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, Currency } from '../../types/finance';
import { useFinanceStore } from '../../store/FinanceStore';
import type { CategoryDto } from '../../types/api/categories';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { FormField } from '../shared/FormField';
import { CategorySelect } from '../shared/CategorySelect';
import { AmountInput } from '../shared/AmountInput';
import { TransactionTypeToggle } from './TransactionTypeToggle';

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
    fromAccountId: initial?.fromAccountId ?? accounts[0]?.id ?? '',
    toAccountId: initial?.toAccountId ?? '',
    amount: initial?.amount ?? 0,
    description: initial?.description ?? '',
    date: initial?.date ?? new Date().toISOString().split('T')[0],
    currency: (initial?.currency ?? 'PEN') as Currency,
  });

  const isEditMode = Boolean(initial);

  useEffect(() => {
    if (!form.fromAccountId && accounts.length > 0) {
      setForm(prev => ({ ...prev, fromAccountId: accounts[0].id }));
    }
  }, [accounts, form.fromAccountId]);

  const visibleCategories: CategoryDto[] = categories.filter(
    c => c.isActive && c.type === (type === 'expense' ? 'Expense' : 'Income'),
  );

  const selectedCategory =
    visibleCategories.find(c => c.id === selectedCategoryId) ?? visibleCategories[0];

  const destinationAccounts = accounts.filter(a => a.id !== form.fromAccountId);

  const set = (key: keyof typeof form, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleTypeChange = (next: TransactionType) => {
    setType(next);
    setSelectedCategoryId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: Omit<Transaction, 'id' | 'createdAt'> = {
      fromAccountId: form.fromAccountId,
      type,
      category: type === 'transfer' ? 'Transferencia' : (selectedCategory?.name ?? ''),
      categoryId: type === 'transfer' ? undefined : selectedCategory?.id,
      categoryColor: type === 'transfer' ? undefined : (selectedCategory?.color ?? undefined),
      categoryKeyIcon: type === 'transfer' ? undefined : (selectedCategory?.keyIcon ?? undefined),
      amount: parseFloat(form.amount.toString()) || 0,
      description: form.description,
      date: form.date,
      currency: form.currency,
      ...(type === 'transfer' && { toAccountId: form.toAccountId }),
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
    ? 'Agregar Gasto'
    : type === 'income'
    ? 'Agregar Ingreso'
    : 'Agregar Transferencia';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <TransactionTypeToggle
        value={type}
        onChange={handleTypeChange}
        disabled={isEditMode}
      />

      <AmountInput
        required
        value={form.amount}
        onChange={val => set('amount', val)}
        currency={form.currency}
        onCurrencyChange={val => set('currency', val)}
        min="0.01"
      />

      <FormField label="Descripción">
        <Input
          placeholder="Ej: Supermercado La Comer"
          value={form.description}
          onChange={e => set('description', e.target.value)}
        />
      </FormField>

      {type !== 'transfer' && (
          <FormField label="Categoría" required>
            {visibleCategories.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">Cargando categorías…</p>
            ) : (
              <CategorySelect
                options={visibleCategories.map(c => ({ id: c.id, name: c.name, iconKey: c.keyIcon, color: c.color }))}
                value={selectedCategoryId}
                onChange={setSelectedCategoryId}
              />
            )}
          </FormField>
      )}

      <FormField label={type === 'transfer' ? 'Cuenta origen' : 'Cuenta'} required>
        <Select
          required
          value={form.fromAccountId}
          onChange={e => set('fromAccountId', e.target.value)}
        >
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </Select>
      </FormField>

      {type === 'transfer' && (
        <FormField label="Cuenta destino" required>
          <Select
            required
            value={form.toAccountId}
            onChange={e => set('toAccountId', e.target.value)}
          >
            <option value="">Selecciona cuenta destino</option>
            {destinationAccounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </FormField>
      )}

      <FormField label="Fecha" required>
        <Input
          required
          type="date"
          value={form.date}
          onChange={e => set('date', e.target.value)}
        />
      </FormField>
        

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`flex-1 text-white rounded-xl py-3 text-sm font-medium transition-colors disabled:opacity-70 ${submitColor}`}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
