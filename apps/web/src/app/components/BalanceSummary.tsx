import { useFinanceStore } from '../store/FinanceStore';
import { SummaryCard } from './ui/SummaryCard';

export function BalanceSummary() {
  const userBalance = useFinanceStore(state => state.userBalance);

  if (!userBalance) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: userBalance.currencyCode,
    }).format(amount);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          label="Ingresos"
          value={formatCurrency(userBalance.totalIncome)}
          colorVariant="emerald"
        />
        <SummaryCard
          label="Gastos"
          value={formatCurrency(userBalance.totalExpense)}
          colorVariant="rose"
        />
        <SummaryCard
          label="Balance"
          value={formatCurrency(userBalance.balance)}
          colorVariant={userBalance.balance >= 0 ? 'emerald' : 'rose'}
        />
      </div>
    </div>
  );
}
