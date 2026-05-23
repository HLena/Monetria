import { useEffect } from 'react';
import { useFinanceStore } from '../store/FinanceStore';
import { useAuthStore } from '../store/AuthStore';

export function useTransactions() {
  const {
    accounts,
    transactions,
    categories,
    isLoading,
    error,
    listAccounts,
    loadTransactions,
    loadCategories,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinanceStore();

  useEffect(() => {
    const load = () => {
      if (!useAuthStore.persist.hasHydrated()) return;
      const userId = useAuthStore.getState().user?.userId ?? '';
      void listAccounts(userId);
      void loadCategories();
      void loadTransactions();
    };
    if (useAuthStore.persist.hasHydrated()) load();
    return useAuthStore.persist.onFinishHydration(load);
  }, [listAccounts, loadCategories, loadTransactions]);

  return {
    accounts,
    transactions,
    categories,
    isLoading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
