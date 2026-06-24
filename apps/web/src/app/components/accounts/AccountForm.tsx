import React, { useState } from 'react';
import { Account } from '../../types/models';
import { AccountType } from '@monetria/enums';
import { CARD_COLORS } from '../../constants/accountColors';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { FormField } from '../shared/FormField';
import { SectionLabel } from '../shared/SectionLabel';
import { ColorPicker } from '../shared/ColorPicker';
import { Divider } from '../shared/Divider';
import { Landmark, CreditCard, Banknote, Smartphone } from 'lucide-react';

type TypeConfig = {
  icon: typeof Landmark;
  label: string;
  activeBg: string;
  iconBg: string;
  iconColor: string;
  textColor: string;
  sectionTitle: string;
  badge: string;
};

const TYPE_CONFIG: Record<number, TypeConfig> = {
  [AccountType.CreditCard]: {
    icon: CreditCard,
    label: 'Tarjeta de crédito',
    activeBg: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800',
    iconBg: 'bg-violet-100 dark:bg-violet-900/40',
    iconColor: 'text-violet-600 dark:text-violet-400',
    textColor: 'text-violet-700 dark:text-violet-300',
    sectionTitle: 'Datos de tarjeta',
    badge: 'Tarjeta de crédito',
  },
  [AccountType.BankAccount]: {
    icon: Landmark,
    label: 'Cuenta bancaria',
    activeBg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    sectionTitle: 'Datos bancarios',
    badge: 'Cuenta bancaria',
  },
  [AccountType.Cash]: {
    icon: Banknote,
    label: 'Efectivo',
    activeBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    sectionTitle: '',
    badge: 'Efectivo',
  },
  [AccountType.Wallet]: {
    icon: Smartphone,
    label: 'Billetera digital',
    activeBg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',
    iconBg: 'bg-orange-100 dark:bg-orange-900/40',
    iconColor: 'text-orange-600 dark:text-orange-400',
    textColor: 'text-orange-700 dark:text-orange-300',
    sectionTitle: 'Datos de billetera',
    badge: 'Billetera digital',
  },
};

const TYPE_ORDER = [
  AccountType.CreditCard,
  AccountType.BankAccount,
  AccountType.Cash,
  AccountType.Wallet,
];

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
    currentBalance: initial?.currentBalance ?? 0,
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

      {/* Tipo de cuenta */}
      <SectionLabel>Tipo de cuenta</SectionLabel>
      <div>
        <div className="grid grid-cols-4 gap-2">
          {TYPE_ORDER.map(type => {
            const cfg = TYPE_CONFIG[type];
            const Icon = cfg.icon;
            const isActive = form.type === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => set('type', type)}
                disabled={mode === 'edit'}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isActive
                    ? cfg.activeBg
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isActive ? cfg.iconBg : 'bg-slate-100 dark:bg-slate-700'
                }`}>
                  <Icon className={`w-4 h-4 ${isActive ? cfg.iconColor : 'text-slate-400 dark:text-slate-500'}`} />
                </div>
                <span className={`text-xs text-center leading-tight ${
                  isActive ? `${cfg.textColor} font-medium` : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {cfg.label}
                </span>
              </button>
            );
          })}
        </div>
        {mode === 'edit' && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
            El tipo de cuenta no puede cambiarse una vez creada.
          </p>
        )}
      </div>

      <Divider />

      {/* Información básica */}
      <SectionLabel>Información básica</SectionLabel>
      <FormField label="Nombre de la cuenta" required>
        <Input
          required
          placeholder="Ej: Visa Santander"
          value={form.name}
          onChange={e => set('name', e.target.value)}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Moneda">
          <Select
            value={form.currencyCode}
            onChange={e => set('currencyCode', e.target.value)}
          >
            <option value="PEN">🇵🇪 Sol peruano (S/)</option>
            <option value="USD">🇺🇸 Dólar (USD)</option>
          </Select>
        </FormField>
        <div>
          <FormField label="Saldo inicial">
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.currentBalance || ''}
              onChange={e => set('currentBalance', parseFloat(e.target.value) || 0)}
            />
          </FormField>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Monto que ya tenías antes de usar Monetria
          </p>
        </div>
      </div>

      <Divider />

      {/* Efectivo */}
      {form.type === AccountType.Cash && (
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
          <p className="text-sm pb-1 font-bold text-slate-500 dark:text-slate-400 mb-1">
            💵 Efectivo
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Las cuentas de efectivo no requieren datos adicionales.
            Solo necesitas el nombre y el saldo inicial.
          </p>
        </div>
      )}

      {/* Cuenta bancaria */}
      {form.type === AccountType.BankAccount && (
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-3">
          <p className="text-sm pb-1 font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5" />
            Datos bancarios
            <span className="ml-auto bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full">
              Cuenta bancaria
            </span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Entidad financiera">
              <Input
                placeholder="Ej: BBVA"
                value={form.institutionName ?? ''}
                onChange={e => set('institutionName', e.target.value)}
              />
            </FormField>
            <FormField label="Últimos 4 dígitos">
              <Input
                maxLength={4}
                placeholder="1234"
                value={form.cardLast4Digits ?? ''}
                onChange={e => set('cardLast4Digits', e.target.value.replace(/\D/g, ''))}
              />
            </FormField>
            <div className="col-span-2">
              <FormField label="Titular (mayúsculas)">
                <Input
                  className="uppercase"
                  placeholder="NOMBRE APELLIDO"
                  value={form.cardHolderName ?? ''}
                  onChange={e => set('cardHolderName', e.target.value.toUpperCase())}
                />
              </FormField>
            </div>
          </div>
        </div>
      )}

      {/* Tarjeta de crédito */}
      {form.type === AccountType.CreditCard && (
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-3">
          <p className="text-sm pb-1 font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" />
            Datos de tarjeta
            <span className="ml-auto bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full">
              Tarjeta de crédito
            </span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Entidad financiera">
              <Input
                placeholder="Ej: BBVA"
                value={form.institutionName ?? ''}
                onChange={e => set('institutionName', e.target.value)}
              />
            </FormField>
            <FormField label="Últimos 4 dígitos">
              <Input
                maxLength={4}
                placeholder="1234"
                value={form.cardLast4Digits ?? ''}
                onChange={e => set('cardLast4Digits', e.target.value.replace(/\D/g, ''))}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Límite de crédito">
              <Input
                type="number"
                min="0"
                placeholder="25000"
                value={form.creditLimit ?? ''}
                onChange={e => set('creditLimit', parseFloat(e.target.value) || undefined)}
              />
            </FormField>
            <FormField label="Día de facturación">
              <Input
                type="number"
                min="1"
                max="31"
                placeholder="15"
                value={form.statementClosingDay ?? ''}
                onChange={e => set('statementClosingDay', parseInt(e.target.value) || undefined)}
              />
            </FormField>
            <FormField label="Día de pago">
              <Input
                type="number"
                min="1"
                max="31"
                placeholder="5"
                value={form.paymentDueDay ?? ''}
                onChange={e => set('paymentDueDay', parseInt(e.target.value) || undefined)}
              />
            </FormField>
          </div>
        </div>
      )}

      {/* Billetera digital */}
      {form.type === AccountType.Wallet && (
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-3">
          <p className="text-sm pb-1 font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            Datos de billetera
            <span className="ml-auto bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full">
              Billetera digital
            </span>
          </p>
          <FormField label="Entidad financiera">
            <Input
              placeholder="Ej: PayPal"
              value={form.institutionName ?? ''}
              onChange={e => set('institutionName', e.target.value)}
            />
          </FormField>
        </div>
      )}

      <hr className="border-t border-slate-100 dark:border-slate-800" />

      <SectionLabel>Color de cuenta</SectionLabel>
      <ColorPicker
        colors={CARD_COLORS}
        value={form.colorCode}
        onChange={color => set('colorCode', color)}
      />

      <div className="flex gap-3 pt-2">
        <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-700 transition-colors">
          {initial ? 'Guardar cambios' : 'Agregar cuenta'}
        </button>
      </div>
    </form>
  );
}
