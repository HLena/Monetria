import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Account, Budget, Debt, FixedExpense, SavingsGoal, Transaction } from '../types/finance';
import type { CategoryDto } from '../types/api/categories';
import type { UserBalanceDto } from '../types/api/accounts';
import { api, getAuthToken } from '../lib/apiClient';
import { useAuthStore } from './AuthStore';
import { listAccounts, getAccountById, updateAccount as updateAccountApi, deleteAccount as deleteAccountApi, getUserBalance as getUserBalanceApi } from '../api/accounts';
import { listCategories as listCategoriesApi } from '../api/categories';
import {
  listTransactions as listTransactionsApi,
  createTransaction as createTransactionApi,
  updateTransaction as updateTransactionApi,
  deleteTransaction as deleteTransactionApi,
} from '../api/transactions';
import {
  filterAccountDtosForUser,
  mapAccountDtoToFinanceAccount,
  toCreateAccountRequestBody,
} from '../mappers/accountMappers';
import {
  mapTransactionDtoToTransaction,
  toCreateTransactionRequestBody,
  toUpdateTransactionRequestBody,
} from '../mappers/transactionMappers';

interface FinanceStoreState {
  isLoading: boolean;
  error: string | null;
  accounts: Account[];
  account: Account | null;
  categories: CategoryDto[];
  transactions: Transaction[];
  budgets: Budget[];
  fixedExpenses: FixedExpense[];
  savingsGoals: SavingsGoal[];
  debts: Debt[];
  userBalance: UserBalanceDto | null;
  addAccount: (account: Omit<Account, 'id'>, userId: string) => Promise<void>;
  updateAccount: (id: string, account: Omit<Account, 'id'>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  /** Requires non-blank userId and a valid token; otherwise leaves accounts empty and does not call the API. */
  listAccounts: (userId: string) => Promise<void>;
  getAccountById: (id: string) => Promise<void>;
  loadCategories: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  loadUserBalance: () => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceStoreState>()(
  persist(
    (set, get) => ({
      isLoading: false,
      error: null,
      accounts: [],
      account: null,
      categories: [],
      transactions: [],
      budgets: [],
      fixedExpenses: [],
      savingsGoals: [],
      debts: [],
      userBalance: null,

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
          await api.post('/accounts', toCreateAccountRequestBody(account));
          await get().listAccounts(uid);
          set({ isLoading: false, error: null });
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudo crear la cuenta';
          set({ error: msg, isLoading: false });
          throw caught;
        }
      },

      updateAccount: async (id: string, account: Omit<Account, 'id'>) => {
        set({ isLoading: true, error: null });
        try {
          const dto = await updateAccountApi(id, account);
          const updated = mapAccountDtoToFinanceAccount(dto);
          set(state => ({
            accounts: state.accounts.map(a => a.id === id ? updated : a),
            isLoading: false,
            error: null,
          }));
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudo actualizar la cuenta';
          set({ error: msg, isLoading: false });
          throw caught;
        }
      },

      deleteAccount: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await deleteAccountApi(id);
          set(state => ({
            accounts: state.accounts.filter(a => a.id !== id),
            isLoading: false,
            error: null,
          }));
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudo eliminar la cuenta';
          set({ error: msg, isLoading: false });
          throw caught;
        }
      },

      listAccounts: async (userId: string) => {
        set({ isLoading: true, error: null });
        const hasToken = Boolean(getAuthToken());
        const uid = userId?.trim() ?? '';
        if (!hasToken) {
          set({ accounts: [], isLoading: false, error: null });
          return;
        }
        if (!uid) {
          set({ accounts: [], isLoading: false, error: null });
          return;
        }
        try {
          const dtos = await listAccounts();
          const forUser = filterAccountDtosForUser(dtos, uid);
          const mapped = forUser.map(mapAccountDtoToFinanceAccount);
          set({ accounts: mapped, isLoading: false, error: null });
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudieron cargar las cuentas';
          set({ error: msg, isLoading: false });
          throw caught;
        }
      },

      getAccountById: async (id: string) => {
        set({ isLoading: true, error: null });
        if (!getAuthToken()) {
          set({ isLoading: false, error: 'Debes iniciar sesión para ver la cuenta' });
          return;
        }
        try {
          const dto = await getAccountById(id);
          const mapped = mapAccountDtoToFinanceAccount(dto);
          set({
            account: mapped,
            isLoading: false,
            error: null,
          });
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudo cargar la cuenta';
          set({ error: msg, isLoading: false });
          throw caught;
        }
      },

      loadCategories: async () => {
        if (!getAuthToken()) return;
        try {
          const dtos = await listCategoriesApi();
          set({ categories: dtos.filter(c => c.isActive) });
        } catch {
          // non-critical — category resolution falls back gracefully
        }
      },

      loadTransactions: async () => {
        set({ isLoading: true, error: null });
        if (!getAuthToken()) {
          set({ transactions: [], isLoading: false });
          return;
        }
        try {
          const dtos = await listTransactionsApi();
          set({ transactions: dtos.map(mapTransactionDtoToTransaction), isLoading: false, error: null });
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudieron cargar las transacciones';
          set({ error: msg, isLoading: false });
          throw caught;
        }
      },

      loadUserBalance: async () => {
        if (!getAuthToken()) {
          set({ userBalance: null });
          return;
        }
        try {
          const balance = await getUserBalanceApi();
          set({ userBalance: balance });
        } catch {
          // non-critical — balance display is optional
        }
      },

      addTransaction: async (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
        set({ isLoading: true, error: null });
        try {
          const body = toCreateTransactionRequestBody(tx, get().categories);
          const dto = await createTransactionApi(body);
          const created = mapTransactionDtoToTransaction(dto);
          set(state => ({
            transactions: [created, ...state.transactions],
            isLoading: false,
            error: null,
          }));
          void get().listAccounts(useAuthStore.getState().user?.userId ?? '').catch(() => undefined);
          void get().loadUserBalance().catch(() => undefined);
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudo crear la transacción';
          set({ error: msg, isLoading: false });
          throw caught;
        }
      },

      updateTransaction: async (id: string, tx: Omit<Transaction, 'id' | 'createdAt'>) => {
        set({ isLoading: true, error: null });
        try {
          const body = toUpdateTransactionRequestBody(tx, get().categories);
          const dto = await updateTransactionApi(id, body);
          const updated = mapTransactionDtoToTransaction(dto);
          set(state => ({
            transactions: state.transactions.map(t => t.id === id ? updated : t),
            isLoading: false,
            error: null,
          }));
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudo actualizar la transacción';
          set({ error: msg, isLoading: false });
          throw caught;
        }
      },

      deleteTransaction: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await deleteTransactionApi(id);
          set(state => ({
            transactions: state.transactions.filter(t => t.id !== id),
            isLoading: false,
            error: null,
          }));
          void get().listAccounts(useAuthStore.getState().user?.userId ?? '').catch(() => undefined);
          void get().loadUserBalance().catch(() => undefined);
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudo eliminar la transacción';
          set({ error: msg, isLoading: false });
          throw caught;
        }
      },
    }),
    {
      name: 'finance-storage',
      partialize: state => ({
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
        const { accounts: _a, transactions: _t, categories: _c, userBalance: _ub, ...rest } = p;
        return { ...currentState, ...rest };
      },
    },
  ),
);
