import React, { useState } from 'react';
import { Budget, BudgetPeriod, Currency } from '../../types/finance';
import { FORM_COLORS } from '../../../lib/colors';
import { useFinanceStore } from '@/app/store/FinanceStore';
import { AmountInput } from '../shared/AmountInput';
import { CategorySelect } from '../shared/CategorySelect';
import { ToggleGroup } from '../shared/ToggleGroup';
import { ToggleSwitch } from '../shared/ToggleSwitch';

const labelCls = 'text-sm text-slate-600 dark:text-slate-400 font-medium mb-1 block';

const PERIOD_OPTIONS = [
  { value: 'monthly' as BudgetPeriod, label: 'Mensual' },
  { value: 'weekly' as BudgetPeriod, label: 'Semanal' },
];

export function BudgetForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Budget;
  onSave: (data: Omit<Budget, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const { categories } = useFinanceStore();
  const expenseCategories = categories.filter(c => c.isActive && c.type === 'Expense');

  const [form, setForm] = useState({
    categoryId: initial?.categoryId ?? '',
    limit: initial?.limit ?? 0,
    period: (initial?.period ?? 'monthly') as BudgetPeriod,
    color: initial?.color ?? FORM_COLORS[0],
    currency: (initial?.currency ?? 'PEN') as Currency,
    alertOnLimit: initial?.alertOnLimit ?? false,
  });

  const set = (key: keyof typeof form, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, limit: parseFloat(form.limit.toString()) || 0 });
    onClose();
  };

  const categoryOptions = expenseCategories.map(c => ({
    id: c.id,
    name: c.name,
    iconKey: c.keyIcon,
    color: c.color,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <AmountInput
        required
        label="Límite"
        value={form.limit}
        onChange={val => set('limit', val)}
        currency={form.currency}
        onCurrencyChange={val => set('currency', val)}
        min="1"
      />

      <div>
        <label className={labelCls}>Categoría *</label>
        <CategorySelect
          options={categoryOptions}
          value={form.categoryId}
          onChange={id => set('categoryId', id)}
          placeholder="Selecciona categoría"
        />
      </div>

      <div>
        <label className={labelCls}>Periodo *</label>
        <ToggleGroup
          options={PERIOD_OPTIONS}
          value={form.period}
          onChange={val => set('period', val)}
        />
      </div>

      <ToggleSwitch
        value={form.alertOnLimit}
        onChange={val => set('alertOnLimit', val)}
        label="Alerta al límite"
        description="Notificar cuando el gasto se acerque al límite"
      />

      <div className="flex gap-3 pt-2">
        <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-700 transition-colors">
          {initial ? 'Guardar cambios' : 'Crear Presupuesto'}
        </button>
      </div>
    </form>
  );
}
