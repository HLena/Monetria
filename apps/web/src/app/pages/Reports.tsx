import React, { useState, useMemo } from 'react';
import { BarChart2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/app/store';
import { PageContainer, HeaderPage, LoadingState, ErrorBanner, ToggleGroup } from '@/app/components/shared';
import type { ToggleOption } from '@/app/components/shared';
import { useReports, useCategories, useBudgets } from '@/app/hooks';

type MonthsStr = '3' | '6' | '12';

const PERIOD_OPTIONS: ToggleOption<MonthsStr>[] = [
  { value: '3', label: '3 meses' },
  { value: '6', label: '6 meses' },
  { value: '12', label: '12 meses' },
];

function SummaryCard({ label, value, prev, icon: Icon, color }: {
  label: string;
  value: number;
  prev: number;
  icon: React.ElementType;
  color: string;
}) {
  const change = prev > 0 ? ((value - prev) / prev) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-500 text-sm">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
      <p className="text-slate-800 dark:text-slate-100 text-2xl font-bold">{formatCurrency(value)}</p>
      <div className="flex items-center gap-1 mt-1">
        {isPositive ? (
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
        )}
        <span className={`text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
          {Math.abs(change).toFixed(1)}% vs mes anterior
        </span>
      </div>
    </div>
  );
}

export function Reports() {
  const now = new Date();
  const { budgets } = useBudgets(now.getMonth() + 1, now.getFullYear());
  const { categories } = useCategories();
  const [monthsStr, setMonthsStr] = useState<MonthsStr>('3');
  const months = parseInt(monthsStr) as 3 | 6 | 12;
  const { data, isLoading, error } = useReports(months);

  const flowData = data?.monthlyFlow.data ?? [];
  const totalExpensesPeriod = data?.spendingByCategory.totalExpenses ?? 0;
  const totalIncomePeriod = useMemo(() => flowData.reduce((s, m) => s + m.income, 0), [flowData]);

  const lastEntry = flowData[flowData.length - 1];
  const prevEntry = flowData[flowData.length - 2];
  const currentIncome = lastEntry?.income ?? 0;
  const currentExpenses = lastEntry?.expenses ?? 0;
  const prevIncome = prevEntry?.income ?? 0;
  const prevExpenses = prevEntry?.expenses ?? 0;
  const currentMonthLabel = lastEntry?.label ?? '';

  const categoryData = useMemo(
    () => data?.spendingByCategory.data.map(e => ({
      name: e.categoryName,
      value: e.amount,
      color: e.color ?? '#94a3b8',
      percentage: e.percentage,
    })) ?? [],
    [data],
  );

  const balanceTrend = useMemo(
    () => flowData.map((entry, i, arr) => ({
      month: entry.label,
      cumulative: arr.slice(0, i + 1).reduce((sum, e) => sum + (e.income - e.expenses), 0),
    })),
    [flowData],
  );

  const topMonths = useMemo(
    () => [...flowData].filter(m => m.expenses > 0).sort((a, b) => b.expenses - a.expenses).slice(0, 3),
    [flowData],
  );

  const budgetPerformance = budgets.map(b => {
    const cat = categories.find(c => c.id === b.categoryId);
    return {
      category: cat?.name,
      spent: b.spentAmount,
      limit: b.limitAmount,
      color: cat?.color ?? '#6366f1',
    };
  });

  return (
    <PageContainer>
      <HeaderPage
        title="Reportes y Analytics"
        subtitle="Análisis detallado de tus finanzas"
        actions={
          <ToggleGroup
            options={PERIOD_OPTIONS}
            value={monthsStr}
            onChange={setMonthsStr}
            size="sm"
          />
        }
      />

      {error && <ErrorBanner message={error} />}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          label={`Ingresos — ${currentMonthLabel}`}
          value={currentIncome}
          prev={prevIncome}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-600"
        />
        <SummaryCard
          label={`Gastos — ${currentMonthLabel}`}
          value={currentExpenses}
          prev={prevExpenses}
          icon={TrendingDown}
          color="bg-rose-50 text-rose-600"
        />
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <p className="text-slate-500 text-sm mb-3">Total gastos del período</p>
          <p className="text-slate-800 dark:text-slate-100 text-2xl font-bold">{formatCurrency(totalExpensesPeriod)}</p>
          <p className="text-slate-400 text-xs mt-1">{categoryData.length} categorías</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <p className="text-slate-500 text-sm mb-3">Ahorro del período</p>
          <p className="text-slate-800 dark:text-slate-100 text-2xl font-bold">
            {formatCurrency(totalIncomePeriod - totalExpensesPeriod)}
          </p>
          <p className="text-slate-400 text-xs mt-1">Ingresos − Gastos</p>
        </div>
      </div>

      {/* Main charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        {/* Income vs Expenses bar */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <h2 className="text-slate-700 font-semibold mb-4">Ingresos vs Gastos por Mes</h2>
          {isLoading ? (
            <LoadingState message="Cargando gráfico…" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={flowData}>
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
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Ingresos" />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Gastos" />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category pie */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <h2 className="text-slate-700 font-semibold mb-4">Gastos por Categoría</h2>
          {isLoading ? (
            <LoadingState message="Cargando…" />
          ) : categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), '']}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2 max-h-40 overflow-y-auto">
                {categoryData.map(entry => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                      <span className="text-slate-600 truncate">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-slate-400">{entry.percentage.toFixed(0)}%</span>
                      <span className="text-slate-700 font-medium">{formatCurrency(entry.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Sin datos</div>
          )}
        </div>
      </div>

      {/* Balance trend + Monthly balance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <h2 className="text-slate-700 font-semibold mb-4">Tendencia de Balance Acumulado</h2>
          {isLoading ? (
            <LoadingState message="Cargando…" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={balanceTrend}>
                <defs>
                  <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Balance']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="cumulative" stroke="#6366f1" strokeWidth={2} fill="url(#balGrad)" name="Balance" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <h2 className="text-slate-700 font-semibold mb-4">Balance Mensual (Ahorro/Déficit)</h2>
          {isLoading ? (
            <LoadingState message="Cargando…" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={flowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Balance']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }} />
                <Bar dataKey={(d) => d.income - d.expenses} name="Balance" radius={[4, 4, 0, 0]}>
                  {flowData.map((entry, index) => (
                    <Cell key={index} fill={(entry.income - entry.expenses) >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Budget performance + Top spending */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {budgetPerformance.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-slate-700 font-semibold mb-4">Cumplimiento de Presupuesto (mes actual)</h2>
            <div className="space-y-4">
              {budgetPerformance.map(b => {
                const pct = Math.min((b.spent / b.limit) * 100, 150);
                const isOver = b.spent > b.limit;
                return (
                  <div key={b.category}>
                    <div className="flex justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: b.color }} />
                        <span className="text-slate-600">{b.category}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">{formatCurrency(b.spent)} / {formatCurrency(b.limit)}</span>
                        <span className={`font-medium ${isOver ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(pct, 100)}%`, background: isOver ? '#ef4444' : b.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {topMonths.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
              <h2 className="text-slate-700 font-semibold mb-4">Meses con Mayor Gasto</h2>
              <div className="space-y-3">
                {topMonths.map((m, i) => (
                  <div key={m.label} className="flex items-center gap-4">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-700">{m.label}</span>
                        <span className="text-rose-600 font-semibold">{formatCurrency(m.expenses)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${(m.expenses / topMonths[0].expenses) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-5 h-5 opacity-80" />
              <h2 className="font-semibold">Resumen — últimos {months} meses</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/60 text-xs">Total ingresos</p>
                <p className="text-white text-lg font-bold">{formatCurrency(totalIncomePeriod)}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Total gastos</p>
                <p className="text-white text-lg font-bold">{formatCurrency(totalExpensesPeriod)}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Balance neto</p>
                <p className="text-white text-lg font-bold">{formatCurrency(totalIncomePeriod - totalExpensesPeriod)}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Meses activos</p>
                <p className="text-white text-lg font-bold">
                  {flowData.filter(m => m.income > 0 || m.expenses > 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
