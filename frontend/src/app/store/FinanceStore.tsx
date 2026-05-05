import { create } from 'zustand';
import { Account, AccountType, Budget, Debt, FixedExpense, SavingsGoal, Transaction } from '../types/finance';
import { persist } from 'zustand/middleware';
import { api, getAuthToken } from '../lib/apiClient';

interface FinanceStoreState {
  isLoading: boolean;
  error: string | null;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  fixedExpenses: FixedExpense[];
  savingsGoals: SavingsGoal[];
  debts: Debt[];
  addAccount: (account: Omit<Account, 'id'>, userId: string) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  getAccounts: (userId: string) => Promise<void>;
}

/** Alinear con los valores del enum en el backend (ajusta si cambian las constantes del API) */
function accountTypeFromApi(value: number): AccountType {
  switch (value) {
    case 0:
      return 'credit';
    case 1:
      return 'debit';
    case 2:
      return 'cash';
    default:
      return 'debit';
  }
}

/** Inverso de accountTypeFromApi — debe coincidir con el enum del backend */
function accountTypeToApi(t: AccountType): number {
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

const ACCOUNT_COLOR: Record<AccountType, string> = {
  credit: '#ef4444',
  debit: '#2563eb',
  cash: '#d97706',
};

interface CreateAccountApiResponse {
  id: string;
  userId: string;
  name: string;
  type: number;
  initialBalance: string;
  currency: string;
  bank: string;
  cardLast4Digits: string;
  creditLimit: string;
  createdAt: string;
}

function readProp(o: Record<string, unknown>, camel: string, pascal: string): unknown {
  if (camel in o) return o[camel];
  if (pascal in o) return o[pascal];
  return undefined;
}

function readAccountType(o: Record<string, unknown>): number {
  const v = readProp(o, 'type', 'Type');
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number.parseInt(v, 10);
    if (!Number.isNaN(n)) return n;
    const s = v.toLowerCase();
    if (s.includes('credit') || s.includes('credito')) return 0;
    if (s.includes('cash') || s.includes('efectivo')) return 2;
    if (s.includes('debit') || s.includes('debito')) return 1;
  }
  return 1;
}

/** Normaliza una fila del API (camelCase o PascalCase de System.Text.Json). */
function normalizeAccountApiRow(item: unknown): CreateAccountApiResponse | null {
  if (!item || typeof item !== 'object') return null;
  const o = item as Record<string, unknown>;
  const id = readProp(o, 'id', 'Id');
  const name = readProp(o, 'name', 'Name');
  if (id == null || name == null) return null;
  const initialBalance = readProp(o, 'initialBalance', 'InitialBalance');
  const creditLimit = readProp(o, 'creditLimit', 'CreditLimit');
  const createdAt = readProp(o, 'createdAt', 'CreatedAt');
  const userIdVal = readProp(o, 'userId', 'UserId');
  return {
    id: String(id),
    userId: userIdVal != null ? String(userIdVal) : '',
    name: String(name),
    type: readAccountType(o),
    initialBalance: initialBalance != null ? String(initialBalance) : '0',
    currency: String(readProp(o, 'currency', 'Currency') ?? 'MXN'),
    bank: String(readProp(o, 'bank', 'Bank') ?? ''),
    cardLast4Digits: String(
      readProp(o, 'cardLast4Digits', 'CardLast4Digits') ??
        readProp(o, 'cardLastFourDigits', 'CardLastFourDigits') ??
        '',
    ),
    creditLimit: creditLimit != null ? String(creditLimit) : '',
    createdAt: createdAt != null ? String(createdAt) : new Date().toISOString(),
  };
}

/** El backend puede devolver un array puro o un objeto con data/items/accounts. */
function parseAccountsListResponse(data: unknown): CreateAccountApiResponse[] {
  if (data == null) return [];
  if (Array.isArray(data)) {
    return data.map(normalizeAccountApiRow).filter((r): r is CreateAccountApiResponse => r != null);
  }
  if (typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const nested =
      d.data ??
      d.Data ??
      d.items ??
      d.Items ??
      d.accounts ??
      d.Accounts ??
      d.results ??
      d.Results ??
      d.value ??
      d.Value;
    if (Array.isArray(nested)) return parseAccountsListResponse(nested);
    const one = normalizeAccountApiRow(data);
    return one ? [one] : [];
  }
  return [];
}

/** Payload para POST /accounts — el backend espera enum numérico, no strings del front */
function toCreateAccountPayload(a: Omit<Account, 'id'>) {
  return {
    name: a.name,
    type: accountTypeToApi(a.type),
    initialBalance: a.balance,
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

function mapCreateAccountResponseToAccount(r: CreateAccountApiResponse): Account {
  const type = accountTypeFromApi(r.type);
  const balance = Number.parseFloat(String(r.initialBalance ?? '0').replace(',', '.')) || 0;
  const creditRaw = r.creditLimit != null && r.creditLimit !== '' ? String(r.creditLimit) : '';
  const creditLimitNum = creditRaw ? Number.parseFloat(creditRaw.replace(',', '.')) : NaN;
  return {
    id: r.id,
    name: r.name,
    type,
    balance,
    currency: r.currency || 'MXN',
    bank: r.bank?.trim() || undefined,
    cardNumber: r.cardLast4Digits?.trim() || undefined,
    color: ACCOUNT_COLOR[type],
    creditLimit: type === 'credit' && Number.isFinite(creditLimitNum) ? creditLimitNum : undefined,
    createdAt: r.createdAt,
  };
}

export const useFinanceStore = create<FinanceStoreState>()(
  persist(
    (set, get) => ({
      isLoading: false,
      error: null,
      accounts: [],
      transactions: [],
      budgets: [],
      fixedExpenses: [],
      savingsGoals: [],
      debts: [],
      addAccount: async (account: Omit<Account, 'id'>, userId: string) => {
        set({ isLoading: true, error: null });
        if (!getAuthToken()) {
          const msg = 'Debes iniciar sesión para crear una cuenta';
          set({ error: msg, isLoading: false });
          throw new Error(msg);
        }
        const uid = userId?.trim();
        if (!uid) {
          const msg = 'No se puede crear la cuenta sin identificar al usuario';
          set({ error: msg, isLoading: false });
          throw new Error(msg);
        }
        try {
          await api.post<CreateAccountApiResponse>(
            '/accounts',
            toCreateAccountPayload(account),
          );
          await get().getAccounts(uid);
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },
      deleteAccount: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await api.delete(`/accounts/${id}`);
          set({
            accounts: get().accounts.filter(account => account.id !== id),
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },
      getAccounts: async (userId: string) => {
        set({ isLoading: true, error: null });
        if (!getAuthToken()) {
          set({ accounts: [], isLoading: false, error: null });
          return;
        }

        const uid = userId?.trim() ?? '';
        const uidLower = uid.toLowerCase();

        const fetchAndMap = async (path: string): Promise<CreateAccountApiResponse[]> => {
          const payload = await api.get<unknown>(path);
          return parseAccountsListResponse(payload);
        };

        try {
          let rows: CreateAccountApiResponse[] = [];

          if (uid) {
            const qs = new URLSearchParams({ userId: uid }).toString();
            try {
              rows = await fetchAndMap(`/accounts?${qs}`);
            } catch {
              rows = [];
            }
            if (rows.length === 0) {
              const all = await fetchAndMap('/accounts');
              rows = all.filter((r) => {
                const ru = r.userId?.trim().toLowerCase() ?? '';
                return ru === '' || ru === uidLower;
              });
            }
          } else {
            // Hay JWT pero aún no hay userId en memoria (rehidratación): el backend filtra por token.
            // Sin esta rama no se llama a fetch y no aparece nada en Network.
            rows = await fetchAndMap('/accounts');
          }

          const mapped = rows.map(mapCreateAccountResponseToAccount);
          set({ accounts: mapped, isLoading: false, error: null });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'finance-storage',
      // accounts no se persiste: vienen del API; persistirlas reintroducía datos viejos
      // al rehidratar después de getAccounts y vaciaba/sobrescribía el listado.
      partialize: (state) => ({
        transactions: state.transactions,
        budgets: state.budgets,
        fixedExpenses: state.fixedExpenses,
        savingsGoals: state.savingsGoals,
        debts: state.debts,
      }),
      merge: (persistedState, currentState) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return currentState;
        }
        const p = persistedState as Partial<FinanceStoreState>;
        const { accounts: _drop, ...rest } = p;
        return { ...currentState, ...rest };
      },
    },
  ),
);
