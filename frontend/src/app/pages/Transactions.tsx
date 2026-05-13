import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Trash2, Edit2, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, getMonthKey, getCurrentMonthKey } from '../store/FinanceContext';
import { Transaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES, TransactionType } from '../types/finance';
import { Modal } from '../components/Modal';
import { CategoryIconCircle } from '../lib/categoryIcons';
import { useFinanceStore } from '../store/FinanceStore';

function TransactionForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Transaction;
  onSave: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const { accounts } = useFinanceStore();
  const [type, setType] = useState<TransactionType>(initial?.type || 'expense');
  const [form, setForm] = useState({
    accountId: initial?.accountId || (accounts[0]?.id || ''),
    category: initial?.category || EXPENSE_CATEGORIES[0],
    amount: initial?.amount || 0,
    description: initial?.description || '',
    date: initial?.date || new Date().toISOString().split('T')[0],
  });

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const set = (key: keyof typeof form, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, type, amount: parseFloat(form.amount.toString()) || 0 });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type toggle */}
      <div className="flex rounded-xl border border-slate-200 dark:border-slate-600 p-1 gap-1">
        <button
          type="button"
          onClick={() => {
            setType('expense');
            set('category', EXPENSE_CATEGORIES[0]);
          }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            type === 'expense' ? 'bg-rose-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <TrendingDown className="w-4 h-4" /> Gasto
        </button>
        <button
          type="button"
          onClick={() => {
            setType('income');
            set('category', INCOME_CATEGORIES[0]);
          }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            type === 'income' ? 'bg-emerald-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Ingreso
        </button>
      </div>

      <div>
        <label className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-2 block">Categoría *</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-1">
          {categories.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => set('category', c)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-all ${
                form.category === c
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 ring-1 ring-indigo-500'
                  : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
              }`}
            >
              <CategoryIconCircle category={c} size="sm" />
              <span className="text-slate-600 dark:text-slate-300 text-center leading-tight line-clamp-2">{c}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1 block">Cuenta *</label>
          <select
            required
            className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            value={form.accountId}
            onChange={e => set('accountId', e.target.value)}
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1 block">Monto (MXN) *</label>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="0.00"
            value={form.amount || ''}
            onChange={e => set('amount', e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1 block">Fecha *</label>
          <input
            required
            type="date"
            className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.date}
            onChange={e => set('date', e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <label className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1 block">Descripción *</label>
          <input
            required
            className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Ej: Supermercado La Comer"
            value={form.description}
            onChange={e => set('description', e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className={`flex-1 text-white rounded-xl py-2.5 text-sm font-medium transition-colors ${
            type === 'expense' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'
          }`}
        >
          {initial ? 'Guardar cambios' : `Agregar ${type === 'expense' ? 'gasto' : 'ingreso'}`}
        </button>
      </div>
    </form>
  );
}

export function Transactions() {
  const { accounts, transactions } = useFinanceStore();
  const [showForm, setShowForm] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterMonth, setFilterMonth] = useState(getCurrentMonthKey());

  const allMonths = useMemo(() => {
    const keys = new Set(transactions.map(t => getMonthKey(t.date)));
    return Array.from(keys).sort().reverse();
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions
      .filter(t => {
        if (filterType !== 'all' && t.type !== filterType) return false;
        if (filterCategory !== 'all' && t.category !== filterCategory) return false;
        if (filterAccount !== 'all' && t.accountId !== filterAccount) return false;
        if (filterMonth && getMonthKey(t.date) !== filterMonth) return false;
        if (search && !t.description.toLowerCase().includes(search.toLowerCase()) && !t.category.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, filterCategory, filterAccount, filterMonth, search]);

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const allCategories = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.category))).sort();
  }, [transactions]);

  const formatMonthLabel = (key: string) => {
    const [year, month] = key.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 1);
    return d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-slate-800 dark:text-slate-100 text-2xl font-bold">Transacciones</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{filtered.length} movimientos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
        >
          <Plus className="w-4 h-4" />
          Nueva Transacción
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900">
          <p className="text-emerald-600 dark:text-emerald-400 text-xs">Ingresos</p>
          <p className="text-emerald-700 dark:text-emerald-300 text-xl font-bold mt-0.5">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950/30 rounded-2xl p-4 border border-rose-100 dark:border-rose-900">
          <p className="text-rose-600 dark:text-rose-400 text-xs">Gastos</p>
          <p className="text-rose-700 dark:text-rose-300 text-xl font-bold mt-0.5">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900">
          <p className="text-indigo-600 dark:text-indigo-400 text-xs">Balance</p>
          <p className={`text-xl font-bold mt-0.5 ${totalIncome - totalExpenses >= 0 ? 'text-indigo-700 dark:text-indigo-300' : 'text-rose-700 dark:text-rose-400'}`}>
            {formatCurrency(totalIncome - totalExpenses)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-slate-800"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
          >
            <option value="">Todos los meses</option>
            {allMonths.map(m => (
              <option key={m} value={m}>{formatMonthLabel(m)}</option>
            ))}
          </select>
          <select
            className="border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-slate-800"
            value={filterType}
            onChange={e => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
          >
            <option value="all">Todos los tipos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>
          <select
            className="border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-slate-800"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="all">Todas las categorías</option>
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            className="border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-slate-800"
            value={filterAccount}
            onChange={e => setFilterAccount(e.target.value)}
          >
            <option value="all">Todas las cuentas</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>

      {/* Transaction list */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500">
            <Filter className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No hay transacciones con estos filtros</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {filtered.map(tx => {
              const account = accounts.find(a => a.id === tx.accountId);
              return (
                <div key={tx.id} className="flex items-center gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                  <CategoryIconCircle category={tx.category} />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 dark:text-slate-200 text-sm font-medium truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-slate-400 dark:text-slate-500 text-xs">{tx.category}</span>
                      <span className="text-slate-300 dark:text-slate-600 text-xs">·</span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                        style={{
                          background: account ? `${account.colorCode}20` : '#f1f5f9',
                          color: account ? account.colorCode : '#94a3b8',
                        }}
                      >
                        {account?.name || 'Cuenta eliminada'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs">
                      {new Date(tx.date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditTx(tx)}
                      className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {}}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nueva Transacción">
        <TransactionForm
          onSave={ () => {}}
          onClose={() => setShowForm(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editTx} onClose={() => setEditTx(null)} title="Editar Transacción">
        {editTx && (
          <TransactionForm
            initial={editTx}
            onSave={() => {}}
            onClose={() => setEditTx(null)}
          />
        )}
      </Modal>
    </div>
  );
}
