import { useEffect } from 'react';
import { useFinanceStore, useAuthStore } from '@/app/store';

export function useAccount(id: string) {
  const { account, isLoading, error, getAccountById, updateAccount, deleteAccount } = useFinanceStore();

  useEffect(() => {
    const load = () => {
      if (!useAuthStore.persist.hasHydrated()) return;
      if (!id) return;
      void getAccountById(id);
    };
    if (useAuthStore.persist.hasHydrated()) load();
    return useAuthStore.persist.onFinishHydration(load);
  }, [getAccountById, id]);

  return { account, isLoading, error, updateAccount, deleteAccount };
}
