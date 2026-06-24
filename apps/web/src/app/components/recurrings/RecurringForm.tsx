import React, { useState } from 'react';
import {
  EXPENSE_CATEGORIES,
  CATEGORY_COLORS,
  FixedExpense,
  FixedExpensePeriod,
} from '../../types/finance';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { FormField } from '../shared/FormField';
import { CategorySelect } from '../shared/CategorySelect';
import { ToggleSwitch } from '../shared/ToggleSwitch';

const CATEGORY_OPTIONS = EXPENSE_CATEGORIES.map(c => ({
  id: c,
  name: c,
  color: CATEGORY_COLORS[c] ?? null,
}));

export function RecurringForm({
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
    name: initial?.name ?? '',
    amount: initial?.amount ?? 0,
    category: initial?.category ?? EXPENSE_CATEGORIES[0],
    accountId: initial?.accountId ?? accounts[0]?.id ?? '',
    period: (initial?.period ?? 'monthly') as FixedExpensePeriod,
    dueDay: (initial?.dueDay ?? '') as number | '',
    isActive: initial?.isActive ?? true,
    notes: initial?.notes ?? '',
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
      <FormField label="Nombre" required>
        <Input
          required
          placeholder="Ej: Renta, luz, seguro"
          value={form.name}
          onChange={e => set('name', e.target.value)}
        />
      </FormField>

      <FormField label="Categoría" required>
        <CategorySelect
          options={CATEGORY_OPTIONS}
          value={form.category}
          onChange={id => set('category', id)}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Monto" required>
          <Input
            required
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={form.amount || ''}
            onChange={e => set('amount', e.target.value)}
          />
        </FormField>
        <FormField label="Cuenta" required>
          <Select
            required
            value={form.accountId}
            onChange={e => set('accountId', e.target.value)}
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Periodo" required>
          <Select
            required
            value={form.period}
            onChange={e => set('period', e.target.value as FixedExpensePeriod)}
          >
            <option value="monthly">Mensual</option>
            <option value="weekly">Semanal</option>
            <option value="yearly">Anual</option>
          </Select>
        </FormField>
        <FormField label="Día de cargo (1–31)">
          <Input
            type="number"
            min={1}
            max={31}
            placeholder="Opcional"
            value={form.dueDay === '' ? '' : form.dueDay}
            onChange={e => set('dueDay', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
          />
        </FormField>
      </div>

      <ToggleSwitch
        value={form.isActive}
        onChange={val => set('isActive', val)}
        label="Activo"
        description="Incluir en totales y reportes"
      />

      <FormField label="Notas">
        <Input
          placeholder="Opcional"
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
        />
      </FormField>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-700 transition-colors">
          {initial ? 'Guardar' : 'Agregar'}
        </button>
      </div>
    </form>
  );
}
