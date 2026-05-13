import { api } from '../lib/apiClient';
import { parseAccountsListPayload, type AccountsListPayload, toUpdateAccountRequestBody } from '../mappers/accountMappers';
import type { AccountDto } from '../types/api/accounts';
import type { Account } from '../types/models';

export async function listAccounts(): Promise<AccountDto[]> {
  const data: AccountsListPayload = await api.get<AccountsListPayload>('/accounts');
  return parseAccountsListPayload(data);
}

export async function updateAccount(id: string, data: Omit<Account, 'id'>): Promise<AccountDto> {
  return api.put<AccountDto>(`/accounts/${id}`, toUpdateAccountRequestBody(data));
}

export async function deleteAccount(id: string): Promise<void> {
  await api.delete(`/accounts/${id}`);
}
