import { useEffect } from 'react';
import { useFinanceStore } from '@/app/store';

export function useRecurrings() {
  const { recurrings, isLoading, error, loadRecurrings, addRecurring, updateRecurring, deactivateRecurring } =
    useFinanceStore();

  useEffect(() => {
    void loadRecurrings();
  }, [loadRecurrings]);

  return { recurrings, isLoading, error, addRecurring, updateRecurring, deactivateRecurring };
}
