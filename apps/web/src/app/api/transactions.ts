import { api } from '../lib/apiClient';
import type {
  TransactionDto,
  CreateTransactionRequestBody,
  UpdateTransactionRequestBody,
  TransactionResponse,
  TransactionSummaryDto,
  TransactionQueryParams,
} from '../types/api/transactions';

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
