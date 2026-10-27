import { useState, useEffect } from 'react';
import { getMonthlyFlow, getSpendingByCategory } from '@/app/api';
import type { MonthlyFlowResponse, SpendingByCategoryResponse } from '@/app/types/api';

export interface ReportsData {
  monthlyFlow: MonthlyFlowResponse;
  spendingByCategory: SpendingByCategoryResponse;
}

export function useReports(months: 3 | 6 | 12) {
  const [data, setData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      getMonthlyFlow(months, 'month'),
      getSpendingByCategory(months),
    ])
      .then(([monthlyFlow, spendingByCategory]) => {
        setData({ monthlyFlow, spendingByCategory });
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Error cargando reportes');
      })
      .finally(() => setIsLoading(false));
  }, [months]);

  return { data, isLoading, error };
}
