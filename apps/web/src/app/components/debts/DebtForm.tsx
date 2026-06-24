import React, { useState } from 'react';
import { Debt, DebtType } from '../../types/finance';
import { FORM_COLORS } from '../../../lib/colors';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { FormField } from '../shared/FormField';
import { ColorPicker } from '../shared/ColorPicker';

export const DEBT_TYPES: { value: DebtType; label: string }[] = [
  { value: 'personal_loan', label: 'Préstamo Personal' },
  { value: 'credit_card', label: 'Tarjeta de Crédito' },
  { value: 'mortgage', label: 'Hipoteca' },
  { value: 'auto_loan', label: 'Crédito Auto' },
  { value: 'other', label: 'Otro' },
];

export function DebtForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Debt;
  onSave: (data: Omit<Debt, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    creditor: initial?.creditor ?? '',
    type: (initial?.type ?? 'personal_loan') as DebtType,
    totalAmount: initial?.totalAmount ?? 0,
    remainingAmount: initial?.remainingAmount ?? 0,
    interestRate: initial?.interestRate ?? 0,
    minimumPayment: initial?.minimumPayment ?? 0,
    dueDate: initial?.dueDate ?? '',
    color: initial?.color ?? FORM_COLORS[0],
  });

  const set = (key: keyof typeof form, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      totalAmount: parseFloat(form.totalAmount.toString()) || 0,
      remainingAmount: parseFloat(form.remainingAmount.toString()) || 0,
      interestRate: parseFloat(form.interestRate.toString()) || 0,
      minimumPayment: parseFloat(form.minimumPayment.toString()) || 0,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Nombre" required>
          <Input
            required
            placeholder="Ej: Préstamo personal"
            value={form.name}
            onChange={e => set('name', e.target.value)}
          />
        </FormField>
        <FormField label="Acreedor" required>
          <Input
            required
            placeholder="Ej: BBVA"
            value={form.creditor}
            onChange={e => set('creditor', e.target.value)}
          />
        </FormField>
        <FormField label="Tipo" required>
          <Select
            required
            value={form.type}
            onChange={e => set('type', e.target.value as DebtType)}
          >
            {DEBT_TYPES.map(dt => (
              <option key={dt.value} value={dt.value}>{dt.label}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Tasa anual (%)" required>
          <Input
            required
            type="number"
            min="0"
            step="0.01"
            placeholder="12.5"
            value={form.interestRate || ''}
            onChange={e => set('interestRate', e.target.value)}
          />
        </FormField>
        <FormField label="Deuda original" required>
          <Input
            required
            type="number"
            min="0"
            placeholder="0.00"
            value={form.totalAmount || ''}
            onChange={e => set('totalAmount', e.target.value)}
          />
        </FormField>
        <FormField label="Saldo pendiente" required>
          <Input
            required
            type="number"
            min="0"
            placeholder="0.00"
            value={form.remainingAmount || ''}
            onChange={e => set('remainingAmount', e.target.value)}
          />
        </FormField>
        <FormField label="Pago mínimo" required>
          <Input
            required
            type="number"
            min="0"
            placeholder="0.00"
            value={form.minimumPayment || ''}
            onChange={e => set('minimumPayment', e.target.value)}
          />
        </FormField>
        <FormField label="Próximo pago" required>
          <Input
            required
            type="date"
            value={form.dueDate}
            onChange={e => set('dueDate', e.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Color">
        <ColorPicker
          colors={FORM_COLORS}
          value={form.color}
          onChange={color => set('color', color)}
        />
      </FormField>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-700 transition-colors">
          {initial ? 'Guardar cambios' : 'Registrar deuda'}
        </button>
      </div>
    </form>
  );
}
