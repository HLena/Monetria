import { useEffect } from 'react';
import { useFinanceStore } from '../store/FinanceStore';
import { useAuthStore } from '../store/AuthStore';
import { useParams } from 'react-router';

export function useAccount() {
  const {
    account,
    transactions,
    isLoading,
    error,
    getAccountById,
    loadTransactions,
    updateAccount,
    deleteAccount,
  } = useFinanceStore();

  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const load = () => {
      if (!useAuthStore.persist.hasHydrated()) return;
      if (!id) return;
      void getAccountById(id);
      void loadTransactions();
    };
    if (useAuthStore.persist.hasHydrated()) load();
    return useAuthStore.persist.onFinishHydration(load);
  }, [getAccountById, loadTransactions, id]);

  return { account, transactions, isLoading, error, updateAccount, deleteAccount };
}
