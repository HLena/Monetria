import { api } from '@/app/lib';
import type {
  TransactionDto,
  CreateTransactionRequestBody,
  UpdateTransactionRequestBody,
  TransactionResponse,
  TransactionSummaryDto,
  TransactionQueryParams,
  MonthlyFlowResponse,
  SpendingByCategoryResponse,
} from '@/app/types/api';

function toQueryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

export async function listTransactions(params?: TransactionQueryParams): Promise<TransactionResponse> {
  const qs = params ? toQueryString(params as Record<string, string | number | boolean | undefined | null>) : '';
  return api.get<TransactionResponse>(`/transactions${qs}`);
}

export async function getTransactionsSummary(params?: Omit<TransactionQueryParams, 'page' | 'pageSize'>): Promise<TransactionSummaryDto> {
  const qs = params ? toQueryString(params as Record<string, string | number | boolean | undefined | null>) : '';
  return api.get<TransactionSummaryDto>(`/transactions/summary${qs}`);
}

export async function createTransaction(body: CreateTransactionRequestBody): Promise<TransactionDto> {
  return api.post<TransactionDto>('/transactions', body);
}

export async function updateTransaction(id: string, body: UpdateTransactionRequestBody): Promise<TransactionDto> {
  return api.put<TransactionDto>(`/transactions/${id}`, body);
}

export async function deleteTransaction(id: string): Promise<void> {
  await api.delete(`/transactions/${id}`);
}

export async function getMonthlyFlow(
  months: 1 | 3 | 6 | 12,
  granularity: 'month' | 'week',
): Promise<MonthlyFlowResponse> {
  return api.get<MonthlyFlowResponse>(
    `/transactions/monthly-flow?months=${months}&granularity=${granularity}`,
  );
}

export async function getSpendingByCategory(
  months: 1 | 3 | 6 | 12,
): Promise<SpendingByCategoryResponse> {
  return api.get<SpendingByCategoryResponse>(
    `/transactions/spending-by-category?months=${months}`,
  );
}
