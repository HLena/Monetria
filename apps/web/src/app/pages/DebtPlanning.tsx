import { useState } from 'react';
import { Plus, Trash2, Edit2, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../store/FinanceContext';
import { Debt } from '../types/finance';
import { Modal } from '../components/Modal';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useFinanceStore } from '../store/FinanceStore';
import { PageContainer, HeaderPage, SummaryCard, EmptyState } from '../components/shared';
import { DebtForm, DEBT_TYPES } from '../components/debts/DebtForm';
import { DebtCalculator } from '../components/debts/DebtCalculator';

const daysUntilDue = (dateStr: string) => {
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export function DebtPlanning() {
  const { debts } = useFinanceStore();
  const [showForm, setShowForm] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);

  const totalDebt = debts.reduce((s, d) => s + d.remainingAmount, 0);
  const totalOriginal = debts.reduce((s, d) => s + d.totalAmount, 0);
  const totalMonthly = debts.reduce((s, d) => s + d.minimumPayment, 0);
  const paidPercent = totalOriginal > 0 ? ((totalOriginal - totalDebt) / totalOriginal) * 100 : 0;

  const getDebtTypeLabel = (type: Debt['type']) =>
    DEBT_TYPES.find(t => t.value === type)?.label ?? 'Otro';

  const barData = debts.map(d => ({
    name: d.name.length > 12 ? d.name.slice(0, 12) + '…' : d.name,
    paid: d.totalAmount - d.remainingAmount,
    remaining: d.remainingAmount,
    color: d.color,
  }));

  return (
    <PageContainer>
      <HeaderPage
        title="Planificación de Deudas"
        subtitle={`${debts.length} deudas registradas`}
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <Plus className="w-4 h-4" />
            Nueva Deuda
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Deuda Total" value={formatCurrency(totalDebt)} colorVariant="rose" />
        <SummaryCard label="Ya Pagado" value={formatCurrency(totalOriginal - totalDebt)} colorVariant="emerald" />
        <SummaryCard label="Pagos Mensuales" value={formatCurrency(totalMonthly)} colorVariant="amber" />
        <SummaryCard label="Progreso General" value={`${paidPercent.toFixed(0)}%`} colorVariant="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {debts.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="text-slate-700 dark:text-slate-200 font-semibold mb-4">Deuda Pagada vs Pendiente</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), '']}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="paid" name="Pagado" fill="#10b981" stackId="a" />
                  <Bar dataKey="remaining" name="Pendiente" radius={[0, 4, 4, 0]} stackId="a">
                    {barData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {debts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <EmptyState
                icon={CheckCircle2}
                message="¡Sin deudas registradas!"
                description="Registra tus deudas para hacer un seguimiento"
                action={
                  <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                    Registrar deuda
                  </button>
                }
              />
            </div>
          ) : (
            debts.map(debt => {
              const paidAmount = debt.totalAmount - debt.remainingAmount;
              const pct = Math.min((paidAmount / debt.totalAmount) * 100, 100);
              const daysLeft = daysUntilDue(debt.dueDate);
              const isUrgent = daysLeft <= 5;

              return (
                <div key={debt.id} className={`bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border ${isUrgent ? 'border-rose-200 dark:border-rose-900' : 'border-slate-100 dark:border-slate-800'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${debt.color}20` }}>
                        <TrendingDown className="w-6 h-6" style={{ color: debt.color }} />
                      </div>
                      <div>
                        <p className="text-slate-800 dark:text-slate-100 font-semibold">{debt.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-slate-400 text-xs">{debt.creditor}</span>
                          <span className="text-slate-300 text-xs">·</span>
                          <span className="text-slate-400 text-xs">{getDebtTypeLabel(debt.type)}</span>
                        </div>
                      </div>
                    </div>
                    {isUrgent && (
                      <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs px-2 py-1 rounded-full">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {daysLeft <= 0 ? 'Vencida' : `${daysLeft}d`}
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500 dark:text-slate-400">Pagado: {formatCurrency(paidAmount)}</span>
                      <span className="text-slate-500 dark:text-slate-400">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#10b981' }} />
                    </div>
                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                      Saldo pendiente: <span className="text-rose-600 dark:text-rose-400 font-medium">{formatCurrency(debt.remainingAmount)}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                      <p className="text-slate-700 dark:text-slate-200 text-sm font-semibold">{debt.interestRate}%</p>
                      <p className="text-slate-400 dark:text-slate-500 text-xs">Tasa anual</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                      <p className="text-slate-700 dark:text-slate-200 text-sm font-semibold">{formatCurrency(debt.minimumPayment).replace('MX$', '$')}</p>
                      <p className="text-slate-400 dark:text-slate-500 text-xs">Pago mín.</p>
                    </div>
                    <div className={`rounded-xl p-3 text-center ${isUrgent ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-slate-50 dark:bg-slate-800'}`}>
                      <p className={`text-sm font-semibold ${isUrgent ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}>
                        {daysLeft <= 0 ? 'Hoy' : `${daysLeft}d`}
                      </p>
                      <p className="text-slate-400 dark:text-slate-500 text-xs">Próximo pago</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setEditDebt(debt)}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={() => {}}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-4">
          <DebtCalculator />

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-slate-700 dark:text-slate-200 font-semibold mb-3">Estrategias</h3>
            <div className="space-y-3">
              <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-3">
                <p className="text-indigo-700 dark:text-indigo-300 text-xs font-semibold">Método Avalancha</p>
                <p className="text-indigo-600 dark:text-indigo-400 text-xs mt-0.5">Paga primero la deuda con mayor tasa de interés. Ahorras más dinero a largo plazo.</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3">
                <p className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold">Método Bola de Nieve</p>
                <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">Paga primero la deuda más pequeña. Genera motivación con victorias rápidas.</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3">
                <p className="text-amber-700 dark:text-amber-300 text-xs font-semibold">Consolida tus deudas</p>
                <p className="text-amber-600 dark:text-amber-400 text-xs mt-0.5">Considera unir varias deudas en una sola con menor tasa de interés.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Registrar Deuda" size="lg">
        <DebtForm onSave={() => {}} onClose={() => setShowForm(false)} />
      </Modal>
      <Modal isOpen={!!editDebt} onClose={() => setEditDebt(null)} title="Editar Deuda" size="lg">
        {editDebt && (
          <DebtForm initial={editDebt} onSave={() => {}} onClose={() => setEditDebt(null)} />
        )}
      </Modal>
    </PageContainer>
  );
}
