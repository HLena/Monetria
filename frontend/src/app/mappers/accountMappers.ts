import type { AccountDto, AccountTypeApi } from '../types/api/accounts';
import type { Account, AccountType } from '../types/finance';

/** JSON subset used to validate GET /accounts payloads without resorting to `unknown`. */
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | JsonRecord;
export interface JsonRecord {
  readonly [key: string]: JsonValue;
}

export type AccountsListPayload = JsonValue | undefined;

const ACCOUNT_COLOR: Record<AccountType, string> = {
  credit: '#ef4444',
  debit: '#2563eb',
  cash: '#d97706',
};

function isRecord(value: JsonValue): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readProp(o: JsonRecord, camel: string, pascal: string): JsonValue | undefined {
  if (Object.prototype.hasOwnProperty.call(o, camel)) return o[camel];
  if (Object.prototype.hasOwnProperty.call(o, pascal)) return o[pascal];
  return undefined;
}

function parseAccountTypeValue(v: JsonValue | undefined): AccountTypeApi | null {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) {
    switch (v) {
      case 0:
        return 'Credit';
      case 1:
        return 'Debit';
      case 2:
        return 'Cash';
      default:
        return null;
    }
  }
  if (typeof v === 'string') {
    const n = Number.parseInt(v, 10);
    if (!Number.isNaN(n)) return parseAccountTypeValue(n);
    const s = v.trim().toLowerCase();
    if (s.includes('credit') || s.includes('credito')) return 'Credit';
    if (s.includes('debit') || s.includes('debito')) return 'Debit';
    if (s.includes('cash') || s.includes('efectivo')) return 'Cash';
  }
  return null;
}

function toNumberOrNaN(v: JsonValue | undefined): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number.parseFloat(v.replace(',', '.'));
    if (!Number.isNaN(n)) return n;
  }
  return NaN;
}

function optionalString(v: JsonValue | undefined): string | null {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  return String(v);
}

/**
 * Parses GET /accounts body: root JSON array of account objects (see Results.Ok(accounts)).
 */
export function parseAccountsListPayload(data: AccountsListPayload): AccountDto[] {
  if (data == null) return [];
  if (!Array.isArray(data)) return [];
  const out: AccountDto[] = [];
  for (const item of data) {
    const dto = parseAccountDto(item);
    if (dto) out.push(dto);
  }
  return out;
}

function parseAccountDto(item: JsonValue): AccountDto | null {
  if (!isRecord(item)) return null;
  const id = readProp(item, 'id', 'Id');
  const userIdVal = readProp(item, 'userId', 'UserId');
  if (id == null || userIdVal == null) return null;
  const nameRaw = readProp(item, 'name', 'Name');
  const typeRaw = readProp(item, 'type', 'Type');
  const initialBalanceRaw = readProp(item, 'initialBalance', 'InitialBalance');
  const currencyRaw = readProp(item, 'currency', 'Currency');
  const createdAtRaw = readProp(item, 'createdAt', 'CreatedAt');

  const apiType = parseAccountTypeValue(typeRaw);
  if (apiType == null) return null;

  const bal = toNumberOrNaN(initialBalanceRaw);
  if (!Number.isFinite(bal)) return null;

  const creditRaw = readProp(item, 'creditLimit', 'CreditLimit');
  let creditLimit: number | null = null;
  if (creditRaw != null) {
    const c = toNumberOrNaN(creditRaw);
    creditLimit = Number.isFinite(c) ? c : null;
  }

  const createdAt =
    createdAtRaw != null && typeof createdAtRaw === 'string'
      ? createdAtRaw
      : createdAtRaw != null
        ? String(createdAtRaw)
        : new Date().toISOString();

  const displayName = nameRaw === undefined || nameRaw === null ? null : optionalString(nameRaw);

  return {
    id: String(id),
    userId: String(userIdVal),
    name: displayName,
    type: apiType,
    initialBalance: bal,
    currency: String(currencyRaw ?? 'MXN'),
    bank: optionalString(readProp(item, 'bank', 'Bank')),
    cardLast4Digits: optionalString(
      readProp(item, 'cardLast4Digits', 'CardLast4Digits') ??
        readProp(item, 'cardLastFourDigits', 'CardLastFourDigits'),
    ),
    creditLimit,
    createdAt,
  };
}

function accountTypeApiToDomain(t: AccountTypeApi): AccountType {
  switch (t) {
    case 'Credit':
      return 'credit';
    case 'Debit':
      return 'debit';
    case 'Cash':
      return 'cash';
    default:
      return 'debit';
  }
}

export function mapAccountDtoToFinanceAccount(dto: AccountDto): Account {
  const domainType = accountTypeApiToDomain(dto.type);
  const balance = dto.initialBalance;
  const creditLimitNum = dto.creditLimit;
  return {
    id: dto.id,
    name: dto.name?.trim() ? dto.name.trim() : '',
    type: domainType,
    initialBalance: balance,
    currency: dto.currency || 'MXN',
    bank: dto.bank?.trim() || undefined,
    cardNumber: dto.cardLast4Digits?.trim() || undefined,
    color: ACCOUNT_COLOR[domainType],
    creditLimit:
      domainType === 'credit' && creditLimitNum != null && Number.isFinite(creditLimitNum)
        ? creditLimitNum
        : undefined,
    createdAt: dto.createdAt,
  };
}

/** Defense in depth: keep only rows whose userId matches the authenticated user id (normalized). */
export function filterAccountDtosForUser(dtos: AccountDto[], userId: string): AccountDto[] {
  const want = userId.trim().toLowerCase();
  if (!want) return [];
  return dtos.filter((d) => d.userId.trim().toLowerCase() === want);
}

/** Maps domain account type to backend enum ordinal (CreateAccountRequest). */
export function accountTypeToApiNumber(t: AccountType): number {
  switch (t) {
    case 'credit':
      return 0;
    case 'debit':
      return 1;
    case 'cash':
      return 2;
    default:
      return 1;
  }
}

export function toCreateAccountRequestBody(a: Omit<Account, 'id'>) {
  return {
    name: a.name,
    type: accountTypeToApiNumber(a.type),
    initialBalance: a.initialBalance,
    currency: a.currency || 'USD',
    bank: a.bank ?? '',
    cardLast4Digits: a.cardNumber ?? '',
    ...(a.creditLimit ? { creditLimit: a.creditLimit } : {}),
    ...(a.billingDate ? { billingDate: a.billingDate } : {}),
    ...(a.paymentDate ? { paymentDate: a.paymentDate } : {}),
    ...(a.cardHolder ? { cardHolder: a.cardHolder } : {}),
    ...(a.expiryDate ? { expiryDate: a.expiryDate } : {}),
  };
}
