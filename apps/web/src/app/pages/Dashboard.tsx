import React from 'react';
import { Link } from 'react-router';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  ArrowRight,
  AlertTriangle,
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
import { formatCurrency, useAuthStore, useFinanceStore } from '@/app/store';
import { CategoryIconCircle } from '@/app/lib';
import { mapTransactionDtoToTransaction } from '@/app/mappers';
import { PageContainer, LoadingState, ErrorBanner } from '@/app/components/shared';
import { TransactionGroupedList } from '@/app/components/transactions';
import { AccountCardGrid } from '@/app/components/accounts';
import { useDashboard } from '@/app/hooks';

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subLabel,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  subLabel?: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-500 dark:text-slate-400 text-sm">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color} dark:opacity-90`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-28 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
      ) : (
        <p className="text-slate-800 dark:text-slate-100 text-2xl font-bold">{value}</p>
      )}
      {subLabel && <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">{subLabel}</p>}
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuthStore();
  const { accounts, savingsGoals, categories } = useFinanceStore();
  const { data, isLoading, error } = useDashboard();

  const netWorth = data?.dashboard.netWorth ?? 0;
  const creditCardDebt = data?.dashboard.creditCardDebt ?? 0;
  const monthlyIncome = data?.dashboard.currentMonth.income ?? 0;
  const monthlyExpenses = data?.dashboard.currentMonth.expenses ?? 0;

  const flowChartData = data?.monthlyFlow.data ?? [];
  const pieData = data?.spendingByCategory.data ?? [];

  const overBudget = (data?.dashboard.budgets ?? []).filter(b => b.spentAmount > b.limitAmount);
  const recentTransactions = (data?.dashboard.recentTransactions ?? []).map(mapTransactionDtoToTransaction);
  const topSavings = savingsGoals.slice(0, 3);

  const currentMonthLabel = new Date()
    .toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase());

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-slate-800 dark:text-slate-100 text-2xl font-bold">
          Buenos días, {user ? `${user.firstName} ${user.lastName}` : 'bienvenido'} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Patrimonio Neto"
          value={formatCurrency(netWorth)}
          icon={Wallet}
          color="bg-indigo-50 text-indigo-600"
          subLabel={`${accounts.length} cuentas activas`}
          loading={isLoading}
        />
        <StatCard
          label="Ingresos del Mes"
          value={formatCurrency(monthlyIncome)}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-600"
          subLabel={currentMonthLabel}
          loading={isLoading}
        />
        <StatCard
          label="Gastos del Mes"
          value={formatCurrency(monthlyExpenses)}
          icon={TrendingDown}
          color="bg-rose-50 text-rose-600"
          subLabel={`Balance: ${formatCurrency(monthlyIncome - monthlyExpenses)}`}
          loading={isLoading}
        />
        <StatCard
          label="Deuda Total Tarjetas"
          value={formatCurrency(creditCardDebt)}
          icon={CreditCard}
          color="bg-amber-50 text-amber-600"
          subLabel="Saldo a pagar"
          loading={isLoading}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {/* Weekly income vs expenses */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-slate-700 dark:text-slate-200 font-semibold">Ingresos vs Gastos</h2>
            <span className="text-slate-400 dark:text-slate-500 text-xs">Este mes por semana</span>
          </div>
          {isLoading ? (
            <LoadingState message="Cargando gráfico…" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={flowChartData}>
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
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
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
            </>
          )}
        </div>

        {/* Spending by category pie */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-slate-700 dark:text-slate-200 font-semibold">Gastos por Categoría</h2>
            <span className="text-slate-400 dark:text-slate-500 text-xs">Este mes</span>
          </div>
          {isLoading ? (
            <LoadingState message="Cargando…" />
          ) : pieData.length > 0 ? (
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
                    dataKey="amount"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color ?? '#94a3b8'} />
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
                  <div key={entry.categoryName} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <CategoryIconCircle iconKey={entry.keyIcon ?? undefined} color={entry.color ?? undefined} size="sm" />
                      <span className="text-slate-600 dark:text-slate-300 truncate">{entry.categoryName}</span>
                    </div>
                    <span className="text-slate-700 dark:text-slate-200 font-medium flex-shrink-0 ml-2">{formatCurrency(entry.amount)}</span>
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

      {/* Accounts */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-slate-700 dark:text-slate-200 font-semibold">Mis Cuentas</h2>
          <Link to="/settings" className="text-indigo-600 dark:text-indigo-400 text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all">
            Administrar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {accounts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-sm">
            Sin cuentas registradas
          </div>
        ) : (
          <AccountCardGrid accounts={accounts} />
        )}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Transactions */}
        
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-slate-700 dark:text-slate-200 font-semibold">Transacciones Recientes</h2>
            <Link to="/movements" className="text-indigo-600 dark:text-indigo-400 text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all">
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {isLoading ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <LoadingState message="Cargando transacciones…" />
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-sm">
              Sin transacciones recientes
            </div>
          ) : (
            <TransactionGroupedList items={recentTransactions} accounts={accounts} />
          )}
        </div>

        {/* Right column: Alerts + Savings */}
        <div className="space-y-4">
          {overBudget.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 border border-amber-100 dark:border-amber-900">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-amber-700 dark:text-amber-300 font-semibold text-sm">Presupuestos Excedidos</h3>
              </div>
              <div className="space-y-2">
                {overBudget.map(b => (
                  <div key={b.id} className="flex items-center justify-between text-xs">
                    <span className="text-amber-600 dark:text-amber-400">{categories.find(c => c.id === b.categoryId)?.name ?? b.categoryId}</span>
                    <span className="text-amber-700 dark:text-amber-300 font-medium">Excedido</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
            {topSavings.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-xs text-center py-4">Sin metas de ahorro</p>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
