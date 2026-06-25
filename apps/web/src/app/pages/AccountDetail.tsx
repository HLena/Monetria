import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { TrendingUp, TrendingDown, Calendar, CreditCard, Pencil, Trash2, Plus } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getMonthKey } from '../store/FinanceContext';
import { formatAmount } from '../lib/formatAmount';
import { AccountType } from '../types/finance';
import type { Transaction } from '../types/finance';
import { CreditCardVisual } from '../components/CreditCardVisual';
import { CategoryIconCircle } from '../lib/categoryIcons';
import { useFinanceStore } from '../store/FinanceStore';
import { Modal } from '../components/Modal';
import { AccountForm } from '../components/accounts/AccountForm';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { TransactionGroupedList } from '../components/transactions/TransactionGroupedList';
import { HeaderPage, PageContainer, LoadingState, ErrorBanner, EmptyState, Pagination } from '../components/shared';
import { useAccount } from '../hooks/useAccount';
import { useAccountTransactions } from '../hooks/useAccountTransactions';

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { account, isLoading: accountLoading, error: accountError, updateAccount, deleteAccount } = useAccount();
  const {
    items,
    allItems,
    summary,
    page,
    totalPages,
    setPage,
    isLoading: txLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useAccountTransactions(id ?? '');

  const { accounts } = useFinanceStore();

  const [showEdit, setShowEdit] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteTx = async (txId: string) => {
    if (!confirm('¿Eliminar este movimiento?')) return;
    await deleteTransaction(txId);
  };

  const isLoading = accountLoading && account === null;

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState message="Cargando cuenta…" />
      </PageContainer>
    );
  }

  if (accountError) {
    return (
      <PageContainer>
        <ErrorBanner
          message={accountError}
          onClose={() => useFinanceStore.setState({ error: null })}
        />
      </PageContainer>
    );
  }

  if (!account) {
    return (
      <PageContainer>
        <EmptyState
          icon={CreditCard}
          message="Cuenta no encontrada"
          description="Es posible que haya sido eliminada."
          action={<Link to="/accounts" className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline">Volver a cuentas</Link>}
        />
      </PageContainer>
    );
  }

  const isCard = account.type === AccountType.CreditCard || account.type === AccountType.BankAccount;
  const isCredit = account.type === AccountType.CreditCard;

  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpenses = summary?.totalExpenses ?? 0;

  // Analytics use allItems (all pages, no filters)
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = getMonthKey(d);
    const income = allItems
      .filter(t => getMonthKey(t.date) === key && t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = allItems
      .filter(t => getMonthKey(t.date) === key && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { month: MONTHS_ES[d.getMonth()], income, expenses };
  });

  const categoryList = Object.values(
    allItems
      .filter(t => t.type === 'expense' && t.categoryId)
      .reduce<Record<string, { id: string; name: string; iconKey: string | null | undefined; color: string | null | undefined; amount: number }>>((acc, t) => {
        if (!acc[t.categoryId!]) {
          acc[t.categoryId!] = { id: t.categoryId!, name: t.category || t.categoryId!, iconKey: t.categoryKeyIcon, color: t.categoryColor, amount: 0 };
        }
        acc[t.categoryId!].amount += t.amount;
        return acc;
      }, {})
  ).sort((a, b) => b.amount - a.amount);

  const availableCredit = isCredit ? (account.creditLimit ?? 0) + account.currentBalance : 0;
  const usagePercent =
    isCredit && account.creditLimit
      ? ((account.currentBalance < 0 ? -account.currentBalance : account.currentBalance) / account.creditLimit) * 100
      : 0;

  const subtitle = [
    account.type === AccountType.CreditCard ? 'Tarjeta de Crédito'
      : account.type === AccountType.BankAccount ? 'Cuenta Bancaria'
      : account.type === AccountType.Wallet ? 'Billetera'
      : 'Efectivo',
    account.institutionName,
  ].filter(Boolean).join(' · ');

  return (
    <PageContainer>
      <HeaderPage
        title={account.name}
        subtitle={subtitle}
        onBack={() => navigate(-1)}
        actions={
          <>
            <button
              onClick={() => setShowEdit(true)}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-colors"
              title="Editar cuenta"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
              title="Eliminar cuenta"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Card + Info */}
        <div className="lg:col-span-2 space-y-4">
          <CreditCardVisual account={account} />

          {isCard && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="text-slate-700 dark:text-slate-200 font-semibold text-sm">Información de la Cuenta</h3>
              {account.cardHolderName && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Titular</span>
                  <span className="text-slate-700 dark:text-slate-200 font-medium">{account.cardHolderName}</span>
                </div>
              )}
              {account.cardLast4Digits && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Terminación</span>
                  <span className="text-slate-700 dark:text-slate-200">•••• {account.cardLast4Digits}</span>
                </div>
              )}
              {isCredit && account.creditLimit && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Límite</span>
                    <span className="text-slate-700 dark:text-slate-200 font-medium">{formatAmount(account.creditLimit, account.currencyCode)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Disponible</span>
                    <span className="text-emerald-600 font-medium">{formatAmount(availableCredit, account.currencyCode)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Consumido</span>
                    <span className="text-rose-600 font-medium">{formatAmount(account.currentBalance, account.currencyCode)}</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Uso de crédito</span>
                      <span className={usagePercent > 70 ? 'text-rose-500' : 'text-slate-500'}>{usagePercent.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(usagePercent, 100)}%`,
                          background: usagePercent > 80 ? '#ef4444' : usagePercent > 60 ? '#f59e0b' : '#10b981',
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
              {isCredit && account.statementClosingDay && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Día de corte</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-700 dark:text-slate-200">Día {account.statementClosingDay}</span>
                  </div>
                </div>
              )}
              {isCredit && account.paymentDueDay && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Pago límite</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-700 dark:text-slate-200">Día {account.paymentDueDay}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Total ingresos</p>
              <p className="text-emerald-700 dark:text-emerald-300 font-bold text-sm">{formatAmount(totalIncome, account.currencyCode)}</p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/30 rounded-xl p-3 border border-rose-100 dark:border-rose-900">
              <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400 mb-1" />
              <p className="text-xs text-rose-600 dark:text-rose-400">Total gastos</p>
              <p className="text-rose-700 dark:text-rose-300 font-bold text-sm">{formatAmount(totalExpenses, account.currencyCode)}</p>
            </div>
          </div>
        </div>

        {/* Right: Chart + Transactions */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-slate-700 dark:text-slate-200 font-semibold mb-4">Movimientos por Mes</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => [formatAmount(value, account.currencyCode), '']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Ingresos" />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Gastos" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {categoryList.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="text-slate-700 dark:text-slate-200 font-semibold mb-4">Gastos por Categoría</h3>
              <div className="space-y-3">
                {categoryList.map(cat => {
                  const pct = totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0;
                  return (
                    <div key={cat.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <CategoryIconCircle iconKey={cat.iconKey ?? undefined} color={cat.color ?? undefined} size="sm" />
                          <span className="text-slate-600 dark:text-slate-300 truncate">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-slate-400 dark:text-slate-500 text-xs">{pct.toFixed(0)}%</span>
                          <span className="text-slate-700 dark:text-slate-200 font-medium">{formatAmount(cat.amount, account.currencyCode)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cat.color ?? '#94a3b8' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transaction history — paginated */}
          <div>
            <h3 className="text-slate-700 dark:text-slate-200 font-semibold px-1 mb-3">
              Historial ({allItems.length} movimientos)
            </h3>
            {txLoading && items.length === 0 ? (
              <LoadingState message="Cargando transacciones…" />
            ) : items.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <EmptyState icon={CreditCard} message="Sin movimientos en esta cuenta" />
              </div>
            ) : (
              <>
                <TransactionGroupedList
                  items={items}
                  accounts={accounts}
                  onEdit={setEditTx}
                  onDelete={id => void handleDeleteTx(id)}
                />
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Editar cuenta" size="lg">
        <AccountForm
          initial={account}
          onSave={async data => { await updateAccount(account.id, data); }}
          onClose={() => setShowEdit(false)}
          mode="edit"
        />
      </Modal>

      <Modal isOpen={showAddTx} onClose={() => setShowAddTx(false)} title="Nueva Transacción">
        <TransactionForm
          onSave={async data => { await addTransaction(data); }}
          onClose={() => setShowAddTx(false)}
        />
      </Modal>

      <Modal isOpen={!!editTx} onClose={() => setEditTx(null)} title="Editar movimiento">
        {editTx && (
          <TransactionForm
            initial={editTx}
            onSave={async data => { await updateTransaction(editTx.id, data); setEditTx(null); }}
            onClose={() => setEditTx(null)}
          />
        )}
      </Modal>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Eliminar cuenta">
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300 text-sm">
            ¿Eliminar la cuenta{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-100">"{account.name}"</span>?
            {' '}El historial de transacciones se conservará.
          </p>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={async () => {
                setIsDeleting(true);
                try {
                  await deleteAccount(account.id);
                  navigate('/accounts');
                } finally {
                  setIsDeleting(false);
                  setShowDeleteConfirm(false);
                }
              }}
              className="flex-1 bg-rose-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-rose-700 transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
