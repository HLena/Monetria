import React, { useState } from 'react';
import { Account } from '../../types/models';
import { AccountType } from '../../types/enums';
import { CARD_COLORS } from '../../constants/accountColors';

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300';
const labelCls = 'text-sm text-slate-600 font-medium mb-1 block';

export function AccountForm({
  initial,
  onSave,
  onClose,
  mode = 'create',
}: {
  initial?: Account;
  onSave: (data: Omit<Account, 'id'>) => void | Promise<void>;
  onClose: () => void;
  mode?: 'create' | 'edit';
}) {
  const [form, setForm] = useState<Omit<Account, 'id'>>({
    name: initial?.name ?? '',
    type: initial?.type ?? AccountType.Cash,
    cardLast4Digits: initial?.cardLast4Digits ?? '',
    cardHolderName: initial?.cardHolderName ?? '',
    expiryDate: initial?.expiryDate ?? '',
    institutionName: initial?.institutionName ?? '',
    initialBalance: initial?.initialBalance ?? 0,
    creditLimit: initial?.creditLimit,
    statementClosingDay: initial?.statementClosingDay,
    paymentDueDay: initial?.paymentDueDay,
    colorCode: initial?.colorCode ?? CARD_COLORS[0],
    currencyCode: initial?.currencyCode ?? 'PEN',
    createdAt: initial?.createdAt ?? new Date().toISOString(),
  });

  const set = (key: keyof typeof form, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(form);
      onClose();
    } catch {
      /* el store guarda el error */
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre + tipo + saldo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelCls}>Nombre de la cuenta *</label>
          <input
            required
            className={inputCls}
            placeholder="Ej: Visa Santander"
            value={form.name}
            onChange={e => set('name', e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Tipo *</label>
          <select
            required
            className={`${inputCls} bg-white`}
            value={form.type}
            onChange={e => set('type', parseInt(e.target.value) as AccountType)}
            disabled={mode === 'edit'} 
          >
            <option value={AccountType.CreditCard}>Tarjeta de Crédito</option>
            <option value={AccountType.BankAccount}>Cuenta Bancaria</option>
            <option value={AccountType.Cash}>Efectivo</option>
            <option value={AccountType.Wallet}>Billetera</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>
            {form.type === AccountType.CreditCard ? 'Saldo actual (deuda)' : 'Saldo Inicial'} *
          </label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            className={inputCls}
            value={form.initialBalance}
            onChange={e => set('initialBalance', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Campos específicos de cuenta bancaria */}
      {form.type === AccountType.BankAccount && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Entidad financiera</label>
            <input
              className={inputCls}
              placeholder="Ej: BBVA"
              value={form.institutionName ?? ''}
              onChange={e => set('institutionName', e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Últimos 4 dígitos</label>
            <input
              maxLength={4}
              className={inputCls}
              placeholder="1234"
              value={form.cardLast4Digits ?? ''}
              onChange={e => set('cardLast4Digits', e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <div>
            <label className={labelCls}>Titular (mayúsculas)</label>
            <input
              className={`${inputCls} uppercase`}
              placeholder="NOMBRE APELLIDO"
              value={form.cardHolderName ?? ''}
              onChange={e => set('cardHolderName', e.target.value.toUpperCase())}
            />
          </div>
        </div>
      )}

      {/* Campos específicos de tarjeta de crédito */}
      {form.type === AccountType.CreditCard && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Entidad financiera</label>
              <input
                className={inputCls}
                placeholder="Ej: BBVA"
                value={form.institutionName ?? ''}
                onChange={e => set('institutionName', e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Últimos 4 dígitos</label>
              <input
                maxLength={4}
                className={inputCls}
                placeholder="1234"
                value={form.cardLast4Digits ?? ''}
                onChange={e => set('cardLast4Digits', e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Límite de crédito</label>
              <input
                type="number"
                min="0"
                className={inputCls}
                placeholder="25000"
                value={form.creditLimit ?? ''}
                onChange={e => set('creditLimit', parseFloat(e.target.value) || undefined)}
              />
            </div>
            <div>
              <label className={labelCls}>Día de facturación</label>
              <input
                type="number"
                min="1"
                max="31"
                className={inputCls}
                placeholder="15"
                value={form.statementClosingDay ?? ''}
                onChange={e => set('statementClosingDay', parseInt(e.target.value) || undefined)}
              />
            </div>
            <div>
              <label className={labelCls}>Día de pago</label>
              <input
                type="number"
                min="1"
                max="31"
                className={inputCls}
                placeholder="5"
                value={form.paymentDueDay ?? ''}
                onChange={e => set('paymentDueDay', parseInt(e.target.value) || undefined)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Campos específicos de billetera */}
      {form.type === AccountType.Wallet && (
        <div>
          <label className={labelCls}>Entidad financiera</label>
          <input
            className={inputCls}
            placeholder="Ej: PayPal"
            value={form.institutionName ?? ''}
            onChange={e => set('institutionName', e.target.value)}
          />
        </div>
      )}

      {/* Selector de color */}
      <div>
        <label className={labelCls}>Color</label>
        <div className="flex gap-2 flex-wrap">
          {CARD_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => set('colorCode', color)}
              className={`w-8 h-8 rounded-full transition-all ${form.colorCode === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
              style={{ background: color }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          {initial ? 'Guardar cambios' : 'Agregar cuenta'}
        </button>
      </div>
    </form>
  );
}
