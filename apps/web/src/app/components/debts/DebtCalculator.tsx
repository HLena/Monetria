import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { formatCurrency } from '../../store/FinanceContext';

export function DebtCalculator() {
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
        <h2 className="text-slate-700 dark:text-slate-200 font-semibold">Calculadora de Deuda</h2>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Saldo de la deuda ($)</label>
          <input
            type="number"
            min="0"
            className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="50,000"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Tasa anual (%)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="12.5"
            value={rate}
            onChange={e => setRate(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Pago mensual ($)</label>
          <input
            type="number"
            min="0"
            className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
          <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-4 space-y-2 border border-indigo-100 dark:border-indigo-900">
            <div className="flex justify-between text-sm">
              <span className="text-indigo-600 dark:text-indigo-400">Tiempo para liquidar</span>
              <span className="text-indigo-700 dark:text-indigo-300 font-bold">
                {result.months >= 12
                  ? `${Math.floor(result.months / 12)} años ${result.months % 12} meses`
                  : `${result.months} meses`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-indigo-600 dark:text-indigo-400">Intereses totales</span>
              <span className="text-rose-600 dark:text-rose-400 font-semibold">{formatCurrency(result.totalInterest)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-indigo-600 dark:text-indigo-400">Total a pagar</span>
              <span className="text-indigo-700 dark:text-indigo-300 font-bold">{formatCurrency(result.totalPaid)}</span>
            </div>
          </div>
        ) : payment && amountNum && rateNum ? (
          <div className="bg-rose-50 dark:bg-rose-950/30 rounded-xl p-3 text-rose-600 dark:text-rose-400 text-sm border border-rose-100 dark:border-rose-900">
            El pago es insuficiente para cubrir los intereses. Aumenta el monto.
          </div>
        ) : null}
      </div>
    </div>
  );
}
