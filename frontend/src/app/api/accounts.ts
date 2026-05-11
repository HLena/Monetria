import { api } from '../lib/apiClient';
import { parseAccountsListPayload, type AccountsListPayload } from '../mappers/accountMappers';
import type { AccountDto } from '../types/api/accounts';

/**
 * Lists accounts for the authenticated user (JWT). Single URL, no query string.
 */
export async function listAccounts(): Promise<AccountDto[]> {
  const data: AccountsListPayload = await api.get<AccountsListPayload>('/accounts');
  return parseAccountsListPayload(data);
}
