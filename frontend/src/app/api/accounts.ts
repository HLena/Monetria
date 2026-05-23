import { api } from '../lib/apiClient';
import { parseAccountsListPayload, type AccountsListPayload, toUpdateAccountRequestBody } from '../mappers/accountMappers';
import type { AccountSummaryDto, AccountDetailDto, UserBalanceDto } from '../types/api/accounts';
import type { Account } from '../types/models';

export async function listAccounts(): Promise<AccountSummaryDto[]> {
  const data: AccountsListPayload = await api.get<AccountsListPayload>('/accounts');
  return parseAccountsListPayload(data) as AccountSummaryDto[];
}

export async function getAccountById(id: string): Promise<AccountDetailDto> {
  return api.get<AccountDetailDto>(`/accounts/${id}`);
}

export async function getUserBalance(): Promise<UserBalanceDto> {
  return api.get<UserBalanceDto>('/accounts/balance/summary');
}

export async function updateAccount(id: string, data: Omit<Account, 'id'>): Promise<AccountDetailDto> {
  return api.put<AccountDetailDto>(`/accounts/${id}`, toUpdateAccountRequestBody(data));
}

export async function deleteAccount(id: string): Promise<void> {
  await api.delete(`/accounts/${id}`);
}
