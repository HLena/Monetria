/**
 * Wire format for GET/POST account responses (see Monetria.Application.Accounts.AccountResponse).
 * `type` is serialized as strings when JsonStringEnumConverter is enabled.
 */
export type AccountTypeApi = 'Credit' | 'Debit' | 'Cash';

export interface AccountDto {
  id: string;
  userId: string;
  name: string | null;
  /** Serialized AccountType enum (`Credit` | `Debit` | `Cash`). */
  type: AccountTypeApi;
  initialBalance: number;
  currency: string;
  bank?: string | null;
  cardLast4Digits?: string | null;
  creditLimit: number | null;
  createdAt: string;
}
