import { api } from '../lib/apiClient';
import type {
  TransactionDto,
  CreateTransactionRequestBody,
  UpdateTransactionRequestBody,
} from '../types/api/transactions';

export async function listTransactions(): Promise<TransactionDto[]> {
  return api.get<TransactionDto[]>('/transactions');
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
