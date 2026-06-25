import React, { useState } from 'react';
import { Budget } from '../../types/finance';
import { useFinanceStore } from '@/app/store/FinanceStore';
import { AmountInput } from '../shared/AmountInput';
import { CategorySelect } from '../shared/CategorySelect';
import { ErrorMsg } from '../shared/ErrorMsg';

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

  const now = new Date();
  const [form, setForm] = useState({
    categoryId: initial?.categoryId ?? '',
    limitAmount: initial?.limitAmount ?? ('' as number | ''),
    month: initial?.month ?? now.getMonth() + 1,
    year: initial?.year ?? now.getFullYear(),
    rolloverUnused: initial?.rolloverUnused ?? false,
    spentAmount: initial?.spentAmount ?? 0,
  });

  const [errors, setErrors] = useState<{ categoryId?: string; limitAmount?: string }>({});

  const set = (key: keyof typeof form, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    const limitAmount = parseFloat(form.limitAmount.toString()) || 0;
    if (!form.categoryId) errs.categoryId = 'Selecciona una categoría';
    if (limitAmount <= 0) errs.limitAmount = 'El límite debe ser mayor a 0';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave({ ...form, limitAmount });
    onClose();
  };

  const categoryOptions = expenseCategories.map(c => ({
    id: c.id,
    name: c.name,
    iconKey: c.keyIcon,
    color: c.color,
  }));

  const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <div>
        <AmountInput
          label="Límite"
          value={form.limitAmount}
          onChange={val => {
            set('limitAmount', val);
            if (errors.limitAmount) setErrors(prev => ({ ...prev, limitAmount: undefined }));
          }}
          currency="PEN"
        />
        <ErrorMsg message={errors.limitAmount} />
      </div>

      <div>
        <label className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1 block">
          Categoría *
        </label>
        <CategorySelect
          options={categoryOptions}
          value={form.categoryId}
          onChange={id => {
            set('categoryId', id);
            if (errors.categoryId) setErrors(prev => ({ ...prev, categoryId: undefined }));
          }}
          placeholder="Selecciona categoría"
        />
        <ErrorMsg message={errors.categoryId} />
      </div>

      <div className="flex items-center gap-2 px-1 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <span className="text-xs text-slate-500 dark:text-slate-400 flex-1">
          Periodo
        </span>
        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
          {MONTH_NAMES[form.month - 1]} {form.year}
        </span>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 bg-indigo-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          {initial ? 'Guardar cambios' : 'Crear Presupuesto'}
        </button>
      </div>
    </form>
  );
}
