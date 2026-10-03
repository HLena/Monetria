import { useEffect } from 'react';
import { useFinanceStore } from '@/app/store';

export function useBudgets(month: number, year: number) {
  const { budgets, isLoading, error, loadBudgets, addBudget, updateBudget, deleteBudget } = useFinanceStore();

  useEffect(() => {
    void loadBudgets(month, year);
  }, [month, year, loadBudgets]);

  return { budgets, isLoading, error, addBudget, updateBudget, deleteBudget };
}
