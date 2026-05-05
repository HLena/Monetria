import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Plus, Trash2, Eye } from 'lucide-react';
import { Account, AccountType } from '../types/finance';
import { formatCurrency } from '../store/FinanceContext';
import { CreditCardVisual } from '../components/CreditCardVisual';
import { Modal } from '../components/Modal';
import { useAuthStore } from '../store/AuthStore';
import { useFinanceStore } from '../store/FinanceStore';

const CARD_COLORS = [
  '#e63946', '#2563eb', '#059669', '#d97706', '#7c3aed',
  '#db2777', '#0891b2', '#65a30d', '#dc2626', '#9333ea',
];

function AccountForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Account;
  onSave: (data: Omit<Account, 'id'>) => void | Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<Account, 'id'>>({
    name: initial?.name || '',
    type: initial?.type || 'debit',
    cardNumber: initial?.cardNumber || '',
    cardHolder: initial?.cardHolder || '',
    expiryDate: initial?.expiryDate || '',
    bank: initial?.bank || '',
    balance: initial?.balance || 0,
    creditLimit: initial?.creditLimit,
    billingDate: initial?.billingDate,
    paymentDate: initial?.paymentDate,
    color: initial?.color || CARD_COLORS[0],
    currency: initial?.currency || 'MXN',
    createdAt: initial?.createdAt || new Date().toISOString(),
  });

  const set = (key: keyof typeof form, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(form);
      onClose();
    } catch {
      /* el store ya guarda el mensaje en error */
    }
  };

  const isCard = form.type !== 'cash';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-sm text-slate-600 font-medium mb-1 block">Nombre de la cuenta *</label>
          <input
            required
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Ej: Visa Santander"
            value={form.name}
            onChange={e => set('name', e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 font-medium mb-1 block">Tipo *</label>
          <select
            required
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            value={form.type}
            onChange={e => set('type', e.target.value as AccountType)}
          >
            <option value="credit">Tarjeta de Crédito</option>
            <option value="debit">Tarjeta de Débito</option>
            <option value="cash">Efectivo</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-600 font-medium mb-1 block">
            {form.type === 'credit' ? 'Saldo Actual (Deuda)' : 'Saldo Disponible'} *
          </label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.balance}
            onChange={e => set('balance', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {isCard && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-600 font-medium mb-1 block">Banco</label>
            <input
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Ej: BBVA"
              value={form.bank || ''}
              onChange={e => set('bank', e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 font-medium mb-1 block">Últimos 4 dígitos</label>
            <input
              maxLength={4}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="1234"
              value={form.cardNumber || ''}
              onChange={e => set('cardNumber', e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 font-medium mb-1 block">Titular (MAYÚSCULAS)</label>
            <input
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 uppercase"
              placeholder="NOMBRE APELLIDO"
              value={form.cardHolder || ''}
              onChange={e => set('cardHolder', e.target.value.toUpperCase())}
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 font-medium mb-1 block">Fecha de vencimiento</label>
            <input
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="MM/YY"
              maxLength={5}
              value={form.expiryDate || ''}
              onChange={e => {
                let v = e.target.value.replace(/\D/g, '');
                if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
                set('expiryDate', v);
              }}
            />
          </div>
        </div>
      )}

      {form.type === 'credit' && (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-slate-600 font-medium mb-1 block">Límite de crédito</label>
            <input
              type="number"
              min="0"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="25000"
              value={form.creditLimit || ''}
              onChange={e => set('creditLimit', parseFloat(e.target.value) || undefined)}
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 font-medium mb-1 block">Día de facturación</label>
            <input
              type="number"
              min="1"
              max="31"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="15"
              value={form.billingDate || ''}
              onChange={e => set('billingDate', parseInt(e.target.value) || undefined)}
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 font-medium mb-1 block">Día de pago</label>
            <input
              type="number"
              min="1"
              max="31"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="5"
              value={form.paymentDate || ''}
              onChange={e => set('paymentDate', parseInt(e.target.value) || undefined)}
            />
          </div>
        </div>
      )}

      {/* Color picker */}
      <div>
        <label className="text-sm text-slate-600 font-medium mb-2 block">Color de la tarjeta</label>
        <div className="flex gap-2 flex-wrap">
          {CARD_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => set('color', color)}
              className={`w-8 h-8 rounded-full transition-all ${form.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
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

export function Accounts() {
  const user = useAuthStore(s => s.user);
  const {
    accounts,
    transactions,
    addAccount,
    deleteAccount,
    getAccounts,
    isLoading,
    error: accountsError,
  } = useFinanceStore();

  useEffect(() => {
    const load = () => {
      if (!useAuthStore.persist.hasHydrated()) return;
      void getAccounts(useAuthStore.getState().user?.userId ?? '');
    };
    if (useAuthStore.persist.hasHydrated()) {
      load();
    }
    return useAuthStore.persist.onFinishHydration(load);
  }, [getAccounts]);

  useEffect(() => {
    if (!useAuthStore.persist.hasHydrated()) return;
    void getAccounts(user?.userId ?? '');
  }, [getAccounts, user?.userId]);

  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<AccountType | 'all'>('all');

  const filtered = filter === 'all' ? accounts : accounts.filter(a => a.type === filter);

  const totalDebitCash = accounts
    .filter(a => a.type !== 'credit')
    .reduce((sum, a) => sum + a.balance, 0);
  const totalCredit = accounts
    .filter(a => a.type === 'credit')
    .reduce((sum, a) => sum + a.balance, 0);

  const getAccountTransactionTotal = (accountId: string) =>
    transactions
      .filter(t => t.accountId === accountId && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {accountsError && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200 flex justify-between gap-3 items-start"
        >
          <span>{accountsError}</span>
          <button
            type="button"
            onClick={() => useFinanceStore.setState({ error: null })}
            className="shrink-0 text-rose-600 dark:text-rose-300 font-medium hover:underline"
          >
            Cerrar
          </button>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-slate-800 dark:text-slate-100 text-2xl font-bold">Mis Cuentas</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {isLoading ? 'Cargando cuentas…' : `${accounts.length} cuentas registradas`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
        >
          <Plus className="w-4 h-4" />
          Nueva Cuenta
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900">
          <p className="text-emerald-600 dark:text-emerald-400 text-sm">Disponible (Débito + Efectivo)</p>
          <p className="text-emerald-700 dark:text-emerald-300 text-2xl font-bold mt-1">{formatCurrency(totalDebitCash)}</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950/30 rounded-2xl p-4 border border-rose-100 dark:border-rose-900">
          <p className="text-rose-600 dark:text-rose-400 text-sm">Deuda Tarjetas de Crédito</p>
          <p className="text-rose-700 dark:text-rose-300 text-2xl font-bold mt-1">{formatCurrency(totalCredit)}</p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900">
          <p className="text-indigo-600 dark:text-indigo-400 text-sm">Patrimonio Neto</p>
          <p className="text-indigo-700 dark:text-indigo-300 text-2xl font-bold mt-1">{formatCurrency(totalDebitCash - totalCredit)}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {([['all', 'Todas'], ['credit', 'Crédito'], ['debit', 'Débito'], ['cash', 'Efectivo']] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === val
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Accounts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {!isLoading && filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-500 dark:text-slate-400 text-sm rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50">
            No tienes cuentas aún. Pulsa «Nueva cuenta» para agregar una.
          </div>
        )}
        {filtered.map(account => (
          <div key={account.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow">
            <CreditCardVisual account={account} />
            <div className="mt-4 space-y-2">
              {account.type === 'credit' && account.creditLimit && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Límite</span>
                  <span className="text-slate-700 dark:text-slate-200 font-medium">{formatCurrency(account.creditLimit)}</span>
                </div>
              )}
              {account.type === 'credit' && account.billingDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Facturación</span>
                  <span className="text-slate-700 dark:text-slate-200">Día {account.billingDate}</span>
                </div>
              )}
              {account.type === 'credit' && account.paymentDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Pago límite</span>
                  <span className="text-slate-700 dark:text-slate-200">Día {account.paymentDate}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Total consumos</span>
                <span className="text-slate-700 dark:text-slate-200 font-medium">{formatCurrency(getAccountTransactionTotal(account.id))}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                to={`/accounts/${account.id}`}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl py-2 text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Ver detalle
              </Link>
              <button
                onClick={() => {
                  if (confirm(`¿Eliminar la cuenta "${account.name}"?`)) deleteAccount(account.id);
                }}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Agregar Cuenta" size="lg">
        <AccountForm
          onSave={async data => {
            if (!user?.userId) {
              throw new Error('Inicia sesión para crear una cuenta');
            }
            await addAccount(data, user.userId);
          }}
          onClose={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
