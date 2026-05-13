import type { AccountDto } from '../types/api/accounts';
import type { Account } from '@/app/types/models';
import { AccountType } from '@/app/types/enums';

export type AccountsListPayload = unknown;

export function parseAccountsListPayload(data: AccountsListPayload): AccountDto[] {
  if (!Array.isArray(data)) return [];
  return data as AccountDto[];
}

// Backend serializes the enum as a string (JsonStringEnumConverter).
// "EWallet" is the backend name for the frontend's Wallet value.
const BACKEND_TYPE_MAP: Record<string, AccountType> = {
  Cash: AccountType.Cash,
  BankAccount: AccountType.BankAccount,
  CreditCard: AccountType.CreditCard,
  EWallet: AccountType.Wallet,
  Savings: AccountType.Savings,
};

function resolveAccountType(raw: AccountType): AccountType {
  if (typeof (raw as unknown) === 'number') return raw;
  return BACKEND_TYPE_MAP[raw as unknown as string] ?? AccountType.Cash;
}

export function mapAccountDtoToFinanceAccount(dto: AccountDto): Account {
  const type = resolveAccountType(dto.type);
  const creditLimitNum = dto.creditLimit;
  return {
    id: dto.id,
    name: dto.name?.trim() ? dto.name.trim() : '',
    type,
    initialBalance: dto.initialBalance,
    currencyCode: dto.currencyCode,
    colorCode: dto.colorCode || '#000000',
    institutionName: dto.institutionName?.trim() || undefined,
    cardHolderName: dto.cardHolderName?.trim() || undefined,
    cardLast4Digits: dto.cardLast4Digits?.trim() || undefined,
    creditLimit:
      type === AccountType.CreditCard && creditLimitNum != null && Number.isFinite(creditLimitNum)
        ? creditLimitNum
        : undefined,
    statementClosingDay: dto.statementClosingDay ?? undefined,
    paymentDueDay: dto.paymentDueDay ?? undefined,
    createdAt: dto.createdAt,
  };
}

/** Defense in depth: keep only rows whose userId matches the authenticated user id (normalized). */
export function filterAccountDtosForUser(dtos: AccountDto[], userId: string): AccountDto[] {
  const want = userId.trim().toLowerCase();
  if (!want) return [];
  return dtos.filter((d) => d.userId.trim().toLowerCase() === want);
}

const FRONTEND_TYPE_MAP: Record<number, string> = {
  [AccountType.Cash]: 'Cash',
  [AccountType.BankAccount]: 'BankAccount',
  [AccountType.CreditCard]: 'CreditCard',
  [AccountType.Wallet]: 'EWallet',
  [AccountType.Savings]: 'Savings',
};

export function toUpdateAccountRequestBody(a: Omit<Account, 'id'>) {
  return {
    name: a.name,
    initialBalance: a.initialBalance,
    currencyCode: a.currencyCode || 'USD',
    institutionName: a.institutionName ?? null,
    cardHolderName: a.cardHolderName ?? null,
    cardLast4Digits: a.cardLast4Digits ?? null,
    colorCode: a.colorCode,
    creditLimit: a.creditLimit ?? null,
    statementClosingDay: a.statementClosingDay ?? null,
    paymentDueDay: a.paymentDueDay ?? null,
  };
}

export function toCreateAccountRequestBody(a: Omit<Account, 'id'>) {
  return {
    name: a.name,
    type: FRONTEND_TYPE_MAP[a.type] ?? 'Cash',
    initialBalance: a.initialBalance,
    currencyCode: a.currencyCode || 'USD',
    institutionName: a.institutionName ?? '',
    cardLast4Digits: a.cardLast4Digits ?? '',
    colorCode: a.colorCode,
    ...(a.creditLimit ? { creditLimit: a.creditLimit } : {}),
    ...(a.statementClosingDay ? { statementClosingDay: a.statementClosingDay } : {}),
    ...(a.paymentDueDay ? { paymentDueDay: a.paymentDueDay  } : {}),
    ...(a.cardHolderName ? { cardHolderName: a.cardHolderName  } : {}),
    ...(a.expiryDate ? { expiryDate: a.expiryDate } : {}),
  };
}
