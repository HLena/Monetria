import { api } from '../lib/apiClient';
import { parseAccountsListPayload, type AccountsListPayload } from '../mappers/accountMappers';
import type { AccountDto } from '../types/api/accounts';

/**
 * Lists accounts for the authenticated user (JWT). Single URL, no query string.
 */
export async function listAccounts(): Promise<AccountDto[]> {
  // #region agent log
  fetch('http://127.0.0.1:7592/ingest/26a8da7e-5502-422e-8769-a05baec37821',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6cc597'},body:JSON.stringify({sessionId:'6cc597',runId:'initial',hypothesisId:'H4',location:'api/accounts.ts:listAccounts-entry',message:'listAccounts entered',data:{endpoint:'/accounts'},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const data: AccountsListPayload = await api.get<AccountsListPayload>('/accounts');
  return parseAccountsListPayload(data);
}
