import React, { useState } from 'react';
import { Recurring, RecurringType, RecurringAmountType, RecurringFrequency } from '@/app/types/finance';
import { useFinanceStore } from '@/app/store';
import { Input, Select, Button } from '@/app/components/ui';
import { FormField, ErrorMsg, CategorySelect, ToggleGroup, ToggleSwitch } from '@/app/components/shared';

type FormErrors = {
  name?: string;
  accountId?: string;
  categoryId?: string;
  toAccountId?: string;
  amount?: string;
  estimatedAmount?: string;
};

export function RecurringForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Recurring;
  onSave: (data: Omit<Recurring, 'id'>) => void | Promise<void>;
  onClose: () => void;
}) {
  const { accounts, categories } = useFinanceStore();
  const [type, setType] = useState<RecurringType>(initial?.type ?? 'Expense');
  const [amountType, setAmountType] = useState<RecurringAmountType>(initial?.amountType ?? 'Fixed');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const isEditMode = Boolean(initial);
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    name: initial?.name ?? '',
    accountId: initial?.accountId ?? accounts[0]?.id ?? '',
    toAccountId: initial?.toAccountId ?? '',
    categoryId: initial?.categoryId ?? '',
    amount: initial?.amount ?? ('' as number | ''),
    estimatedAmount: initial?.estimatedAmount ?? ('' as number | ''),
    frequency: (initial?.frequency ?? 'Monthly') as RecurringFrequency,
    startDate: initial?.startDate ?? today,
    endDate: initial?.endDate ?? '',
    nextDueDate: initial?.nextDueDate ?? today,
    isActive: initial?.isActive ?? true,
  });

  const set = (key: keyof typeof form, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const visibleCategories = categories.filter(c => c.isActive && c.type === type);
  const destinationAccounts = accounts.filter(a => a.id !== form.accountId);

  const handleTypeChange = (next: RecurringType) => {
    setType(next);
    set('categoryId', '');
    setErrors({});
  };

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = 'El nombre es obligatorio';
    if (!form.accountId) errs.accountId = 'Selecciona una cuenta';

    if (type === 'Transfer') {
      if (!form.toAccountId) errs.toAccountId = 'Selecciona la cuenta destino';
      else if (form.toAccountId === form.accountId)
        errs.toAccountId = 'La cuenta destino debe ser diferente a la cuenta origen';
    } else if (!form.categoryId && visibleCategories.length > 0) {
      errs.categoryId = 'Selecciona una categoría';
    }

    if (amountType === 'Fixed') {
      const amount = parseFloat(String(form.amount));
      if (!form.amount || isNaN(amount) || amount <= 0) errs.amount = 'El monto debe ser mayor a 0';
    } else if (amountType === 'Estimated') {
      const estimated = parseFloat(String(form.estimatedAmount));
      if (!form.estimatedAmount || isNaN(estimated) || estimated <= 0)
        errs.estimatedAmount = 'El monto estimado debe ser mayor a 0';
    }

    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const data: Omit<Recurring, 'id'> = {
      accountId: form.accountId,
      toAccountId: type === 'Transfer' ? form.toAccountId : undefined,
      categoryId: type === 'Transfer' ? undefined : form.categoryId || undefined,
      name: form.name.trim(),
      type,
      amountType,
      amount: amountType === 'Fixed' ? parseFloat(String(form.amount)) : undefined,
      estimatedAmount: amountType === 'Estimated' ? parseFloat(String(form.estimatedAmount)) : undefined,
      frequency: form.frequency,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      nextDueDate: isEditMode ? form.nextDueDate : form.startDate,
      isActive: form.isActive,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <FormField label="Nombre" required>
          <Input
            required
            placeholder="Ej: Renta, luz, seguro"
            value={form.name}
            onChange={e => {
              set('name', e.target.value);
              if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
            }}
          />
        </FormField>
        <ErrorMsg message={errors.name} />
      </div>

      <ToggleGroup
        options={[
          { value: 'Expense', label: 'Gasto' },
          { value: 'Income', label: 'Ingreso' },
          { value: 'Transfer', label: 'Transferencia' },
        ]}
        value={type}
        onChange={handleTypeChange}
      />

      {type !== 'Transfer' && (
        <div>
          <FormField label="Categoría" required>
            {visibleCategories.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">Cargando categorías…</p>
            ) : (
              <CategorySelect
                options={visibleCategories.map(c => ({ id: c.id, name: c.name, iconKey: c.keyIcon, color: c.color }))}
                value={form.categoryId}
                onChange={id => {
                  set('categoryId', id);
                  if (errors.categoryId) setErrors(prev => ({ ...prev, categoryId: undefined }));
                }}
              />
            )}
          </FormField>
          <ErrorMsg message={errors.categoryId} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FormField label={type === 'Transfer' ? 'Cuenta origen' : 'Cuenta'} required>
            <Select required value={form.accountId} onChange={e => set('accountId', e.target.value)}>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </FormField>
          <ErrorMsg message={errors.accountId} />
        </div>

        {type === 'Transfer' && (
          <div>
            <FormField label="Cuenta destino" required>
              <Select
                value={form.toAccountId}
                onChange={e => {
                  set('toAccountId', e.target.value);
                  if (errors.toAccountId) setErrors(prev => ({ ...prev, toAccountId: undefined }));
                }}
              >
                <option value="">Selecciona cuenta destino</option>
                {destinationAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </FormField>
            <ErrorMsg message={errors.toAccountId} />
          </div>
        )}
      </div>

      <FormField label="¿Cómo se registra el monto?" required>
        <ToggleGroup
          options={[
            { value: 'Fixed', label: 'Fijo' },
            { value: 'Estimated', label: 'Estimado' },
            { value: 'VariableFree', label: 'Variable' },
          ]}
          value={amountType}
          onChange={setAmountType}
          size="sm"
        />
      </FormField>

      {amountType === 'Fixed' && (
        <div>
          <FormField label="Monto" required>
            <Input
              required
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={e => {
                set('amount', e.target.value);
                if (errors.amount) setErrors(prev => ({ ...prev, amount: undefined }));
              }}
            />
          </FormField>
          <ErrorMsg message={errors.amount} />
        </div>
      )}

      {amountType === 'Estimated' && (
        <div>
          <FormField label="Monto estimado" required>
            <Input
              required
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.estimatedAmount}
              onChange={e => {
                set('estimatedAmount', e.target.value);
                if (errors.estimatedAmount) setErrors(prev => ({ ...prev, estimatedAmount: undefined }));
              }}
            />
          </FormField>
          <ErrorMsg message={errors.estimatedAmount} />
        </div>
      )}

      {amountType === 'VariableFree' && (
        <p className="text-xs text-slate-400 dark:text-slate-500 -mt-2">
          Ingresarás el monto real cada vez que confirmes una ocurrencia.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Frecuencia" required>
          <Select required value={form.frequency} onChange={e => set('frequency', e.target.value as RecurringFrequency)}>
            <option value="Daily">Diaria</option>
            <option value="Weekly">Semanal</option>
            <option value="Biweekly">Quincenal</option>
            <option value="Monthly">Mensual</option>
            <option value="Yearly">Anual</option>
          </Select>
        </FormField>

        <FormField label="Fecha de inicio" required>
          <Input required type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Fecha de fin (opcional)">
          <Input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
        </FormField>

        {isEditMode && (
          <FormField label="Próxima fecha" required>
            <Input required type="date" value={form.nextDueDate} onChange={e => set('nextDueDate', e.target.value)} />
          </FormField>
        )}
      </div>

      {isEditMode && (
        <ToggleSwitch
          value={form.isActive}
          onChange={val => set('isActive', val)}
          label="Activo"
          description="Genera ocurrencias/transacciones automáticamente"
        />
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl h-11">
          {isSubmitting ? 'Guardando…' : initial ? 'Guardar cambios' : 'Agregar'}
        </Button>
      </div>
    </form>
  );
}
