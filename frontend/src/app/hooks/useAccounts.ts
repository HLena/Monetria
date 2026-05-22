import { useEffect } from 'react';
import { useFinanceStore } from '../store/FinanceStore';
import { useAuthStore } from '../store/AuthStore';

export function useAccounts() {
  const { accounts, isLoading, error, loadAccounts, addAccount, updateAccount, deleteAccount } =
    useFinanceStore();

  useEffect(() => {
    const load = () => {
      if (!useAuthStore.persist.hasHydrated()) return;
      void loadAccounts(useAuthStore.getState().user?.userId ?? '');
    };
    if (useAuthStore.persist.hasHydrated()) load();
    return useAuthStore.persist.onFinishHydration(load);
  }, [loadAccounts]);

  return { accounts, isLoading, error, addAccount, updateAccount, deleteAccount };
}
