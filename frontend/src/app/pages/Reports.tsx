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
import { useFinance, formatCurrency, getMonthKey } from '../store/FinanceContext';
import { CATEGORY_COLORS, AccountType } from '../types/finance';
import { useFinanceStore } from '../store/FinanceStore';
import { PageContainer, HeaderPage } from '../components/shared';

const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

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
  const { transactions, accounts, budgets } = useFinanceStore();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const availableYears = useMemo(() => {
    const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
    years.add(now.getFullYear());
    return Array.from(years).sort().reverse();
  }, [transactions]);

  // Monthly data for selected year
  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const key = `${selectedYear}-${String(i + 1).padStart(2, '0')}`;
      const income = transactions
        .filter(t => getMonthKey(t.date) === key && t.type === 'income')
        .reduce((s, t) => s + t.amount, 0);
      const expenses = transactions
        .filter(t => getMonthKey(t.date) === key && t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);
      return { month: MONTHS_SHORT[i], income, expenses, balance: income - expenses };
    });
  }, [transactions, selectedYear]);

  // Current month stats
  const currentMonthKey = getMonthKey(now);
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = getMonthKey(prevMonthDate);

  const currentIncome = transactions.filter(t => getMonthKey(t.date) === currentMonthKey && t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const currentExpenses = transactions.filter(t => getMonthKey(t.date) === currentMonthKey && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const prevIncome = transactions.filter(t => getMonthKey(t.date) === prevMonthKey && t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const prevExpenses = transactions.filter(t => getMonthKey(t.date) === prevMonthKey && t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // Category data for current year
  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    transactions
      .filter(t => new Date(t.date).getFullYear() === selectedYear && t.type === 'expense')
      .forEach(t => { cats[t.category] = (cats[t.category] || 0) + t.amount; });
    return Object.entries(cats)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }));
  }, [transactions, selectedYear]);

  const totalExpensesYear = categoryData.reduce((s, c) => s + c.value, 0);

  // Account distribution
  const accountData = accounts.map(a => ({
    name: a.name,
    value: a.type === AccountType.CreditCard ? a.currentBalance : a.currentBalance,
    color: a.colorCode,
  }));

  // Monthly balance trend
  const balanceTrend = useMemo(() => {
    let running = 0;
    return monthlyData.map(d => {
      running += d.balance;
      return { ...d, cumulative: running };
    });
  }, [monthlyData]);

  // Top spending months
  const topMonths = [...monthlyData]
    .filter(m => m.expenses > 0)
    .sort((a, b) => b.expenses - a.expenses)
    .slice(0, 3);

  // Budget performance
  const budgetPerformance = budgets.map(b => {
    const spent = transactions
      .filter(t => new Date(t.date).getFullYear() === selectedYear && t.type === 'expense' && t.category === b.category)
      .reduce((s, t) => s + t.amount, 0);
    const limit = b.limit * 12;
    return { category: b.category, spent, limit, color: CATEGORY_COLORS[b.category] || b.color };
  });

  const currentMonthLabel = MONTHS_ES[now.getMonth()];

  return (
    <PageContainer>
      <HeaderPage
        title="Reportes y Analytics"
        subtitle="Análisis detallado de tus finanzas"
        actions={
          <select
            className="border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
          >
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          label={`Ingresos - ${currentMonthLabel}`}
          value={currentIncome}
          prev={prevIncome}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-600"
        />
        <SummaryCard
          label={`Gastos - ${currentMonthLabel}`}
          value={currentExpenses}
          prev={prevExpenses}
          icon={TrendingDown}
          color="bg-rose-50 text-rose-600"
        />
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <p className="text-slate-500 text-sm mb-3">Total gastos {selectedYear}</p>
          <p className="text-slate-800 dark:text-slate-100 text-2xl font-bold">{formatCurrency(totalExpensesYear)}</p>
          <p className="text-slate-400 text-xs mt-1">{categoryData.length} categorías</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <p className="text-slate-500 text-sm mb-3">Ahorro anual {selectedYear}</p>
          <p className="text-slate-800 dark:text-slate-100 text-2xl font-bold">
            {formatCurrency(monthlyData.reduce((s, m) => s + m.income, 0) - totalExpensesYear)}
          </p>
          <p className="text-slate-400 text-xs mt-1">Ingresos - Gastos</p>
        </div>
      </div>

      {/* Main charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        {/* Income vs Expenses bar */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <h2 className="text-slate-700 font-semibold mb-4">Ingresos vs Gastos por Mes ({selectedYear})</h2>
          <ResponsiveContainer width="100%" height={240}>
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
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <h2 className="text-slate-700 font-semibold mb-4">Gastos por Categoría</h2>
          {categoryData.length > 0 ? (
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
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />
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
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[entry.name] || '#94a3b8' }} />
                      <span className="text-slate-600 truncate">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-slate-400">{totalExpensesYear > 0 ? ((entry.value / totalExpensesYear) * 100).toFixed(0) : 0}%</span>
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

      {/* Balance trend + More charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        {/* Cumulative balance trend */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <h2 className="text-slate-700 font-semibold mb-4">Tendencia de Balance Acumulado</h2>
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
        </div>

        {/* Monthly balance bars */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <h2 className="text-slate-700 font-semibold mb-4">Balance Mensual (Ahorro/Déficit)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => [formatCurrency(value), 'Balance']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="balance" name="Balance" radius={[4, 4, 0, 0]}>
                {monthlyData.map((entry, index) => (
                  <Cell key={index} fill={entry.balance >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Budget performance + Top spending */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Budget performance */}
        {budgetPerformance.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-slate-700 font-semibold mb-4">Cumplimiento de Presupuesto ({selectedYear})</h2>
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
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          background: isOver ? '#ef4444' : b.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top spending months + stats */}
        <div className="space-y-4">
          {topMonths.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
              <h2 className="text-slate-700 font-semibold mb-4">Meses con Mayor Gasto</h2>
              <div className="space-y-3">
                {topMonths.map((m, i) => (
                  <div key={m.month} className="flex items-center gap-4">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-700">{m.month}</span>
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

          {/* Year summary */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-5 h-5 opacity-80" />
              <h2 className="font-semibold">Resumen {selectedYear}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/60 text-xs">Total ingresos</p>
                <p className="text-white text-lg font-bold">
                  {formatCurrency(monthlyData.reduce((s, m) => s + m.income, 0))}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Total gastos</p>
                <p className="text-white text-lg font-bold">{formatCurrency(totalExpensesYear)}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Balance neto</p>
                <p className="text-white text-lg font-bold">
                  {formatCurrency(monthlyData.reduce((s, m) => s + m.income, 0) - totalExpensesYear)}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Meses activos</p>
                <p className="text-white text-lg font-bold">
                  {monthlyData.filter(m => m.income > 0 || m.expenses > 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}