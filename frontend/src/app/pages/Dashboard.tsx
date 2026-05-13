import React, { useEffect } from 'react';
import { Link } from 'react-router';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  ArrowRight,
  AlertTriangle,
  Target,
  PiggyBank,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useFinance, formatCurrency, getMonthKey, getCurrentMonthKey } from '../store/FinanceContext';
import { CATEGORY_COLORS, AccountType } from '../types/finance';
import { CreditCardVisual } from '../components/CreditCardVisual';
import { CategoryIconCircle } from '../lib/categoryIcons';
import { useAuthStore } from '../store/AuthStore';
import { useFinanceStore } from '../store/FinanceStore';

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subLabel,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  subLabel?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-500 dark:text-slate-400 text-sm">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color} dark:opacity-90`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
      <p className="text-slate-800 dark:text-slate-100 text-2xl font-bold">{value}</p>
      {subLabel && <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">{subLabel}</p>}
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuthStore();
  const { accounts, transactions, budgets, savingsGoals } = useFinanceStore();
  const currentMonth = getCurrentMonthKey();

  // Calculate total net worth
  const totalDebitCash = accounts
    .filter(a => a.type !== AccountType.CreditCard)
    .reduce((sum, a) => sum + a.initialBalance, 0);
  const totalCreditDebt = accounts
    .filter(a => a.type === AccountType.CreditCard)
    .reduce((sum, a) => sum + a.initialBalance, 0);
  const netWorth = totalDebitCash - totalCreditDebt;

  // Monthly income and expenses
  const monthlyIncome = transactions
    .filter(t => getMonthKey(t.date) === currentMonth && t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpenses = transactions
    .filter(t => getMonthKey(t.date) === currentMonth && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Last 6 months data for chart
  const now = new Date();
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = getMonthKey(d);
    const income = transactions
      .filter(t => getMonthKey(t.date) === key && t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter(t => getMonthKey(t.date) === key && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { month: MONTHS_ES[d.getMonth()], income, expenses };
  });

  // Category spending this month
  const categorySpending = transactions
    .filter(t => getMonthKey(t.date) === currentMonth && t.type === 'expense')
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const pieData = Object.entries(categorySpending)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  // Budget alerts
  const overBudget = budgets.filter(b => {
    const spent = transactions
      .filter(t => getMonthKey(t.date) === currentMonth && t.category === b.category && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return spent > b.limit;
  });

  // Recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Savings progress
  const topSavings = savingsGoals.slice(0, 3);

  const currentMonthLabel = new Date()
    .toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase());

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-slate-800 dark:text-slate-100 text-2xl font-bold">
          Buenos días, {user ? `${user.firstName} ${user.lastName}` : 'bienvenido'} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Patrimonio Neto"
          value={formatCurrency(netWorth)}
          icon={Wallet}
          color="bg-indigo-50 text-indigo-600"
          subLabel={`${accounts.length} cuentas activas`}
        />
        <StatCard
          label="Ingresos del Mes"
          value={formatCurrency(monthlyIncome)}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-600"
          subLabel={currentMonthLabel}
        />
        <StatCard
          label="Gastos del Mes"
          value={formatCurrency(monthlyExpenses)}
          icon={TrendingDown}
          color="bg-rose-50 text-rose-600"
          subLabel={`Balance: ${formatCurrency(monthlyIncome - monthlyExpenses)}`}
        />
        <StatCard
          label="Deuda Total Tarjetas"
          value={formatCurrency(totalCreditDebt)}
          icon={CreditCard}
          color="bg-amber-50 text-amber-600"
          subLabel="Saldo a pagar"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {/* Income vs Expenses chart */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-slate-700 dark:text-slate-200 font-semibold">Ingresos vs Gastos</h2>
            <span className="text-slate-400 dark:text-slate-500 text-xs">Últimos 6 meses</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={last6Months}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" name="Ingresos" />
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGrad)" name="Gastos" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              Ingresos
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              Gastos
            </div>
          </div>
        </div>

        {/* Pie chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-slate-700 dark:text-slate-200 font-semibold">Gastos por Categoría</h2>
            <span className="text-slate-400 dark:text-slate-500 text-xs">Este mes</span>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[entry.name] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), '']}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map(entry => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <CategoryIconCircle category={entry.name} size="sm" />
                      <span className="text-slate-600 dark:text-slate-300 truncate">{entry.name}</span>
                    </div>
                    <span className="text-slate-700 dark:text-slate-200 font-medium flex-shrink-0 ml-2">{formatCurrency(entry.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-400 dark:text-slate-500 text-sm">
              Sin gastos este mes
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-slate-700 dark:text-slate-200 font-semibold">Transacciones Recientes</h2>
            <Link to="/transactions" className="text-indigo-600 dark:text-indigo-400 text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all">
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentTransactions.map(tx => {
              const account = accounts.find(a => a.id === tx.accountId);
              return (
                <div key={tx.id} className="flex items-center gap-3">
                  <CategoryIconCircle category={tx.category} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 dark:text-slate-200 text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs">{tx.category} · {account?.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs">
                      {new Date(tx.date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Alerts + Savings */}
        <div className="space-y-4">
          {/* Budget Alerts */}
          {overBudget.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 border border-amber-100 dark:border-amber-900">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-amber-700 dark:text-amber-300 font-semibold text-sm">Presupuestos Excedidos</h3>
              </div>
              <div className="space-y-2">
                {overBudget.map(b => (
                  <div key={b.id} className="flex items-center justify-between text-xs">
                    <span className="text-amber-600 dark:text-amber-400">{b.category}</span>
                    <span className="text-amber-700 dark:text-amber-300 font-medium">Excedido</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Savings Goals */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-indigo-500" />
                <h2 className="text-slate-700 dark:text-slate-200 font-semibold text-sm">Metas de Ahorro</h2>
              </div>
              <Link to="/savings" className="text-indigo-600 dark:text-indigo-400 text-xs font-medium flex items-center gap-1">
                Ver <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {topSavings.map(goal => {
                const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                return (
                  <div key={goal.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-300 font-medium truncate">{goal.name}</span>
                      <span className="text-slate-500 dark:text-slate-400 flex-shrink-0 ml-2">{percent.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${percent}%`, background: goal.color }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-0.5">
                      <span className="text-slate-400 dark:text-slate-500">{formatCurrency(goal.currentAmount)}</span>
                      <span className="text-slate-400 dark:text-slate-500">{formatCurrency(goal.targetAmount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick accounts */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-slate-700 dark:text-slate-200 font-semibold text-sm">Mis Cuentas</h2>
              <Link to="/accounts" className="text-indigo-600 dark:text-indigo-400 text-xs font-medium flex items-center gap-1">
                Ver <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-2">
              {accounts.slice(0, 4).map(account => (
                <Link key={account.id} to={`/accounts/${account.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                  <div
                    className="w-8 h-8 rounded-lg flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${account.colorCode}cc, ${account.colorCode}66)` }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 dark:text-slate-200 text-xs font-medium truncate">{account.name}</p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs">{account.type === AccountType.CreditCard ? 'Crédito' : account.type === AccountType.Wallet ? 'Efectivo' : 'Débito'}</p>
                  </div>
                  <span className={`text-xs font-semibold ${account.type === AccountType.CreditCard ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {account.type === AccountType.CreditCard ? '-' : ''}{formatCurrency(account.initialBalance)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}