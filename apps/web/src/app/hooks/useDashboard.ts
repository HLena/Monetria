import { useState, useEffect } from 'react';
import { getDashboard, getMonthlyFlow, getSpendingByCategory } from '@/app/api';
import type { DashboardDto, MonthlyFlowResponse, SpendingByCategoryResponse } from '@/app/types/api';

export interface DashboardData {
  dashboard: DashboardDto;
  monthlyFlow: MonthlyFlowResponse;
  spendingByCategory: SpendingByCategoryResponse;
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      getDashboard(),
      getMonthlyFlow(1, 'week'),
      getSpendingByCategory(1),
    ])
      .then(([dashboard, monthlyFlow, spendingByCategory]) => {
        setData({ dashboard, monthlyFlow, spendingByCategory });
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Error cargando el dashboard');
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { data, isLoading, error };
}
