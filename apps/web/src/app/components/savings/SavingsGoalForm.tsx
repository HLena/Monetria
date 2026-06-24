import React, { useState } from 'react';
import { SavingsGoal, CATEGORY_COLORS } from '../../types/finance';
import { FORM_COLORS } from '../../../lib/colors';
import { Input } from '../ui/Input';
import { FormField } from '../shared/FormField';
import { CategorySelect } from '../shared/CategorySelect';
import { ColorPicker } from '../shared/ColorPicker';

const GOAL_CATEGORIES = ['Viajes', 'Tecnología', 'Hogar', 'Vehículo', 'Educación', 'Emergencia', 'Inversión', 'Retiro', 'Otro'];

const GOAL_CATEGORY_OPTIONS = GOAL_CATEGORIES.map(c => ({
  id: c,
  name: c,
  color: CATEGORY_COLORS[c] ?? null,
}));

export function SavingsGoalForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: SavingsGoal;
  onSave: (data: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    targetAmount: initial?.targetAmount ?? 0,
    currentAmount: initial?.currentAmount ?? 0,
    targetDate: initial?.targetDate ?? '',
    category: initial?.category ?? GOAL_CATEGORIES[0],
    color: initial?.color ?? FORM_COLORS[0],
    description: initial?.description ?? '',
  });

  const set = (key: keyof typeof form, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      targetAmount: parseFloat(form.targetAmount.toString()) || 0,
      currentAmount: parseFloat(form.currentAmount.toString()) || 0,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Nombre de la meta" required>
        <Input
          required
          placeholder="Ej: Viaje a Europa"
          value={form.name}
          onChange={e => set('name', e.target.value)}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Meta" required>
          <Input
            required
            type="number"
            min="1"
            placeholder="50000"
            value={form.targetAmount || ''}
            onChange={e => set('targetAmount', e.target.value)}
          />
        </FormField>
        <FormField label="Ahorrado hasta ahora">
          <Input
            type="number"
            min="0"
            placeholder="0"
            value={form.currentAmount || ''}
            onChange={e => set('currentAmount', e.target.value)}
          />
        </FormField>
        <FormField label="Fecha límite" required>
          <Input
            required
            type="date"
            value={form.targetDate}
            onChange={e => set('targetDate', e.target.value)}
          />
        </FormField>
        <FormField label="Categoría">
          <CategorySelect
            options={GOAL_CATEGORY_OPTIONS}
            value={form.category}
            onChange={id => set('category', id)}
          />
        </FormField>
      </div>

      <FormField label="Descripción">
        <textarea
          rows={2}
          className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          placeholder="Descripción opcional..."
          value={form.description}
          onChange={e => set('description', e.target.value)}
        />
      </FormField>

      <FormField label="Color">
        <ColorPicker
          colors={FORM_COLORS}
          value={form.color}
          onChange={color => set('color', color)}
        />
      </FormField>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-700 transition-colors">
          {initial ? 'Guardar cambios' : 'Crear meta'}
        </button>
      </div>
    </form>
  );
}
