import React from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, CreditCard } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useFinance, formatCurrency, getMonthKey } from '../store/FinanceContext';
import { CATEGORY_COLORS } from '../types/finance';
import { CreditCardVisual } from '../components/CreditCardVisual';
import { CategoryIconCircle } from '../lib/categoryIcons';

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accounts, transactions } = useFinance();

  const account = accounts.find(a => a.id === id);
  if (!account) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500 dark:text-slate-400">Cuenta no encontrada</p>
        <Link to="/accounts" className="text-indigo-600 dark:text-indigo-400 mt-2 inline-block">Volver a cuentas</Link>
      </div>
    );
  }

  const accountTransactions = transactions
    .filter(t => t.accountId === id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalIncome = accountTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = accountTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Last 6 months spending
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = getMonthKey(d);
    const income = accountTransactions
      .filter(t => getMonthKey(t.date) === key && t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = accountTransactions
      .filter(t => getMonthKey(t.date) === key && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { month: MONTHS_ES[d.getMonth()], income, expenses };
  });

  // Category breakdown
  const categoryBreakdown = accountTransactions
    .filter(t => t.type === 'expense')
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const categoryList = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a);

  const isCredit = account.type === 'credit';
  const availableCredit = isCredit ? (account.creditLimit ?? 0) - account.balance : 0;
  const usagePercent = isCredit && account.creditLimit ? (account.balance / account.creditLimit) * 100 : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-slate-800 dark:text-slate-100 text-2xl font-bold">{account.name}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{account.bank || 'Cuenta personal'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Card + Info */}
        <div className="lg:col-span-2 space-y-4">
          <CreditCardVisual account={account} />

          {/* Account Info */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
            <h3 className="text-slate-700 dark:text-slate-200 font-semibold text-sm">Información de la Cuenta</h3>
            {account.cardHolder && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Titular</span>
                <span className="text-slate-700 font-medium">{account.cardHolder}</span>
              </div>
            )}
            {account.expiryDate && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Vencimiento</span>
                <span className="text-slate-700">{account.expiryDate}</span>
              </div>
            )}
            {account.cardNumber && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Terminación</span>
                <span className="text-slate-700">•••• {account.cardNumber}</span>
              </div>
            )}
            {isCredit && account.creditLimit && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Límite</span>
                  <span className="text-slate-700 font-medium">{formatCurrency(account.creditLimit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Disponible</span>
                  <span className="text-emerald-600 font-medium">{formatCurrency(availableCredit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Usado</span>
                  <span className="text-rose-600 font-medium">{formatCurrency(account.balance)}</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Uso de crédito</span>
                    <span className={usagePercent > 70 ? 'text-rose-500' : 'text-slate-500'}>{usagePercent.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(usagePercent, 100)}%`,
                        background: usagePercent > 80 ? '#ef4444' : usagePercent > 60 ? '#f59e0b' : '#10b981',
                      }}
                    />
                  </div>
                </div>
              </>
            )}
            {isCredit && account.billingDate && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Día de corte</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-700">Día {account.billingDate}</span>
                </div>
              </div>
            )}
            {isCredit && account.paymentDate && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Pago límite</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-700">Día {account.paymentDate}</span>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Total ingresos</p>
              <p className="text-emerald-700 dark:text-emerald-300 font-bold text-sm">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/30 rounded-xl p-3 border border-rose-100 dark:border-rose-900">
              <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400 mb-1" />
              <p className="text-xs text-rose-600 dark:text-rose-400">Total gastos</p>
              <p className="text-rose-700 dark:text-rose-300 font-bold text-sm">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>

        {/* Right: Chart + Transactions */}
        <div className="lg:col-span-3 space-y-4">
          {/* Monthly chart */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-slate-700 dark:text-slate-200 font-semibold mb-4">Movimientos por Mes</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), '']}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Ingresos" />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Gastos" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category breakdown */}
          {categoryList.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="text-slate-700 dark:text-slate-200 font-semibold mb-4">Gastos por Categoría</h3>
              <div className="space-y-3">
                {categoryList.map(([category, amount]) => {
                  const pct = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                  return (
                    <div key={category}>
                      <div className="flex justify-between text-sm mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <CategoryIconCircle category={category} size="sm" />
                          <span className="text-slate-600 dark:text-slate-300 truncate">{category}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-slate-400 dark:text-slate-500 text-xs">{pct.toFixed(0)}%</span>
                          <span className="text-slate-700 dark:text-slate-200 font-medium">{formatCurrency(amount)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: CATEGORY_COLORS[category] || '#94a3b8' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transaction history */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-slate-700 dark:text-slate-200 font-semibold mb-4">
              Historial ({accountTransactions.length} movimientos)
            </h3>
            {accountTransactions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40" />
                Sin movimientos en esta cuenta
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {accountTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center gap-3">
                    <CategoryIconCircle category={tx.category} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700 dark:text-slate-200 text-sm font-medium truncate">{tx.description}</p>
                      <p className="text-slate-400 dark:text-slate-500 text-xs">{tx.category} · {new Date(tx.date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <span className={`text-sm font-semibold flex-shrink-0 ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
