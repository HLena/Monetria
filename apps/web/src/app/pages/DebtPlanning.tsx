import React, { useState } from 'react';
import { Plus, Trash2, Edit2, TrendingDown, Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useFinance, formatCurrency } from '../store/FinanceContext';
import { Debt, DebtType } from '../types/finance';
import { Modal } from '../components/Modal';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useFinanceStore } from '../store/FinanceStore';
import { PageContainer, HeaderPage } from '../components/shared';

const DEBT_COLORS = [
  '#e63946', '#2563eb', '#7c3aed', '#d97706', '#059669',
  '#db2777', '#0891b2', '#dc2626', '#9333ea',
];

const DEBT_TYPES: { value: DebtType; label: string }[] = [
  { value: 'personal_loan', label: 'Préstamo Personal' },
  { value: 'credit_card', label: 'Tarjeta de Crédito' },
  { value: 'mortgage', label: 'Hipoteca' },
  { value: 'auto_loan', label: 'Crédito Auto' },
  { value: 'other', label: 'Otro' },
];

function DebtForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Debt;
  onSave: (data: Omit<Debt, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    creditor: initial?.creditor || '',
    type: initial?.type || ('personal_loan' as DebtType),
    totalAmount: initial?.totalAmount || 0,
    remainingAmount: initial?.remainingAmount || 0,
    interestRate: initial?.interestRate || 0,
    minimumPayment: initial?.minimumPayment || 0,
    dueDate: initial?.dueDate || '',
    color: initial?.color || DEBT_COLORS[0],
  });

  const set = (key: keyof typeof form, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      totalAmount: parseFloat(form.totalAmount.toString()) || 0,
      remainingAmount: parseFloat(form.remainingAmount.toString()) || 0,
      interestRate: parseFloat(form.interestRate.toString()) || 0,
      minimumPayment: parseFloat(form.minimumPayment.toString()) || 0,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-600 font-medium mb-1 block">Nombre *</label>
          <input
            required
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Ej: Préstamo personal"
            value={form.name}
            onChange={e => set('name', e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 font-medium mb-1 block">Acreedor *</label>
          <input
            required
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Ej: BBVA"
            value={form.creditor}
            onChange={e => set('creditor', e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 font-medium mb-1 block">Tipo *</label>
          <select
            required
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            value={form.type}
            onChange={e => set('type', e.target.value as DebtType)}
          >
            {DEBT_TYPES.map(dt => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-600 font-medium mb-1 block">Tasa anual (%) *</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="12.5"
            value={form.interestRate || ''}
            onChange={e => set('interestRate', e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 font-medium mb-1 block">Deuda original ($) *</label>
          <input
            required
            type="number"
            min="0"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.totalAmount || ''}
            onChange={e => set('totalAmount', e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 font-medium mb-1 block">Saldo pendiente ($) *</label>
          <input
            required
            type="number"
            min="0"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.remainingAmount || ''}
            onChange={e => set('remainingAmount', e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 font-medium mb-1 block">Pago mínimo ($) *</label>
          <input
            required
            type="number"
            min="0"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.minimumPayment || ''}
            onChange={e => set('minimumPayment', e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 font-medium mb-1 block">Próximo pago *</label>
          <input
            required
            type="date"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.dueDate}
            onChange={e => set('dueDate', e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="text-sm text-slate-600 font-medium mb-2 block">Color</label>
        <div className="flex gap-2 flex-wrap">
          {DEBT_COLORS.map(color => (
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
        <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50">Cancelar</button>
        <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-700">
          {initial ? 'Guardar cambios' : 'Registrar deuda'}
        </button>
      </div>
    </form>
  );
}

function DebtCalculator() {
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [payment, setPayment] = useState('');

  const amountNum = parseFloat(amount) || 0;
  const rateNum = parseFloat(rate) || 0;
  const paymentNum = parseFloat(payment) || 0;
  const monthlyRate = rateNum / 100 / 12;

  const calculatePayoff = () => {
    if (!amountNum || !rateNum || !paymentNum || paymentNum <= amountNum * monthlyRate) return null;
    let balance = amountNum;
    let months = 0;
    let totalInterest = 0;
    while (balance > 0 && months < 600) {
      const interest = balance * monthlyRate;
      totalInterest += interest;
      balance = balance + interest - paymentNum;
      months++;
    }
    return { months, totalInterest, totalPaid: amountNum + totalInterest };
  };

  const result = calculatePayoff();
  const minPayment = monthlyRate > 0 ? amountNum * monthlyRate * 1.01 : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-5">
        <Calculator className="w-5 h-5 text-indigo-500" />
        <h2 className="text-slate-700 font-semibold">Calculadora de Deuda</h2>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Saldo de la deuda ($)</label>
          <input
            type="number"
            min="0"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="50,000"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Tasa anual (%)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="12.5"
            value={rate}
            onChange={e => setRate(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Pago mensual ($)</label>
          <input
            type="number"
            min="0"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="2,500"
            value={payment}
            onChange={e => setPayment(e.target.value)}
          />
          {minPayment > 0 && (
            <p className="text-xs text-slate-400 mt-1">
              Pago mínimo recomendado: {formatCurrency(Math.ceil(minPayment))}
            </p>
          )}
        </div>
        {result ? (
          <div className="bg-indigo-50 rounded-xl p-4 space-y-2 border border-indigo-100">
            <div className="flex justify-between text-sm">
              <span className="text-indigo-600">Tiempo para liquidar</span>
              <span className="text-indigo-700 font-bold">
                {result.months >= 12
                  ? `${Math.floor(result.months / 12)} años ${result.months % 12} meses`
                  : `${result.months} meses`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-indigo-600">Intereses totales</span>
              <span className="text-rose-600 font-semibold">{formatCurrency(result.totalInterest)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-indigo-600">Total a pagar</span>
              <span className="text-indigo-700 font-bold">{formatCurrency(result.totalPaid)}</span>
            </div>
          </div>
        ) : payment && amountNum && rateNum ? (
          <div className="bg-rose-50 rounded-xl p-3 text-rose-600 text-sm border border-rose-100">
            El pago es insuficiente para cubrir los intereses. Aumenta el monto.
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function DebtPlanning() {
  const { debts } = useFinanceStore();
  const [showForm, setShowForm] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);

  const totalDebt = debts.reduce((s, d) => s + d.remainingAmount, 0);
  const totalOriginal = debts.reduce((s, d) => s + d.totalAmount, 0);
  const totalMonthly = debts.reduce((s, d) => s + d.minimumPayment, 0);
  const paidPercent = totalOriginal > 0 ? ((totalOriginal - totalDebt) / totalOriginal) * 100 : 0;

  const getDebtTypeLabel = (type: DebtType) =>
    DEBT_TYPES.find(t => t.value === type)?.label || 'Otro';

  const barData = debts.map(d => ({
    name: d.name.length > 12 ? d.name.slice(0, 12) + '…' : d.name,
    paid: d.totalAmount - d.remainingAmount,
    remaining: d.remainingAmount,
    color: d.color,
  }));

  const daysUntilDue = (dateStr: string) => {
    const target = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <PageContainer>
      <HeaderPage
        title="Planificación de Deudas"
        subtitle={`${debts.length} deudas registradas`}
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            Nueva Deuda
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
          <p className="text-rose-600 text-xs">Deuda Total</p>
          <p className="text-rose-700 text-xl font-bold mt-1">{formatCurrency(totalDebt)}</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
          <p className="text-emerald-600 text-xs">Ya Pagado</p>
          <p className="text-emerald-700 text-xl font-bold mt-1">{formatCurrency(totalOriginal - totalDebt)}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
          <p className="text-amber-600 text-xs">Pagos Mensuales</p>
          <p className="text-amber-700 text-xl font-bold mt-1">{formatCurrency(totalMonthly)}</p>
        </div>
        <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
          <p className="text-indigo-600 text-xs">Progreso General</p>
          <p className="text-indigo-700 text-xl font-bold mt-1">{paidPercent.toFixed(0)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Debts list */}
        <div className="lg:col-span-2 space-y-4">
          {/* Bar chart */}
          {debts.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="text-slate-700 font-semibold mb-4">Deuda Pagada vs Pendiente</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), '']}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="paid" name="Pagado" fill="#10b981" radius={[0, 0, 0, 0]} stackId="a" />
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center shadow-sm border border-slate-100 dark:border-slate-800">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-300" />
              <p className="text-slate-500">¡Sin deudas registradas!</p>
              <p className="text-slate-400 text-sm mt-1">Registra tus deudas para hacer un seguimiento</p>
              <button onClick={() => setShowForm(true)} className="mt-4 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700">
                Registrar deuda
              </button>
            </div>
          ) : (
            debts.map(debt => {
              const paidAmount = debt.totalAmount - debt.remainingAmount;
              const pct = Math.min((paidAmount / debt.totalAmount) * 100, 100);
              const daysLeft = daysUntilDue(debt.dueDate);
              const isUrgent = daysLeft <= 5;

              return (
                <div key={debt.id} className={`bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border ${isUrgent ? 'border-rose-200' : 'border-slate-100'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: `${debt.color}20` }}
                      >
                        <TrendingDown className="w-6 h-6" style={{ color: debt.color }} />
                      </div>
                      <div>
                        <p className="text-slate-800 font-semibold">{debt.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-slate-400 text-xs">{debt.creditor}</span>
                          <span className="text-slate-300 text-xs">·</span>
                          <span className="text-slate-400 text-xs">{getDebtTypeLabel(debt.type)}</span>
                        </div>
                      </div>
                    </div>
                    {isUrgent && (
                      <div className="flex items-center gap-1 bg-rose-50 text-rose-600 text-xs px-2 py-1 rounded-full">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {daysLeft <= 0 ? 'Vencida' : `${daysLeft}d`}
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500">Pagado: {formatCurrency(paidAmount)}</span>
                      <span className="text-slate-500">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: '#10b981' }}
                      />
                    </div>
                    <p className="text-slate-400 text-xs mt-1">
                      Saldo pendiente: <span className="text-rose-600 font-medium">{formatCurrency(debt.remainingAmount)}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-slate-700 text-sm font-semibold">{debt.interestRate}%</p>
                      <p className="text-slate-400 text-xs">Tasa anual</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-slate-700 text-sm font-semibold">{formatCurrency(debt.minimumPayment).replace('MX$', '$')}</p>
                      <p className="text-slate-400 text-xs">Pago mín.</p>
                    </div>
                    <div className={`rounded-xl p-3 text-center ${isUrgent ? 'bg-rose-50' : 'bg-slate-50'}`}>
                      <p className={`text-sm font-semibold ${isUrgent ? 'text-rose-600' : 'text-slate-700'}`}>
                        {daysLeft <= 0 ? 'Hoy' : `${daysLeft}d`}
                      </p>
                      <p className="text-slate-400 text-xs">Próximo pago</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setEditDebt(debt)}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-50 text-slate-600 rounded-xl py-2 text-sm font-medium hover:bg-slate-100 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={() => {}}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Calculator */}
        <div>
          <DebtCalculator />

          {/* Strategy tips */}
          <div className="mt-4 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-slate-700 font-semibold mb-3">💡 Estrategias</h3>
            <div className="space-y-3">
              <div className="bg-indigo-50 rounded-xl p-3">
                <p className="text-indigo-700 text-xs font-semibold">Método Avalancha</p>
                <p className="text-indigo-600 text-xs mt-0.5">Paga primero la deuda con mayor tasa de interés. Ahorras más dinero a largo plazo.</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3">
                <p className="text-emerald-700 text-xs font-semibold">Método Bola de Nieve</p>
                <p className="text-emerald-600 text-xs mt-0.5">Paga primero la deuda más pequeña. Genera motivación con victorias rápidas.</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-amber-700 text-xs font-semibold">Consolida tus deudas</p>
                <p className="text-amber-600 text-xs mt-0.5">Considera unir varias deudas en una sola con menor tasa de interés.</p>
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
          <DebtForm
            initial={editDebt}
            onSave={() => {}}
            onClose={() => setEditDebt(null)}
          />
        )}
      </Modal>
    </PageContainer>
  );
}
