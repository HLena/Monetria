import { create } from 'zustand';
import { Account, Budget, Debt, FixedExpense, SavingsGoal, Transaction } from '../types/finance';
import { persist } from 'zustand/middleware';
import { api, getAuthToken } from '../lib/apiClient';
import { listAccounts } from '../api/accounts';
import {
  filterAccountDtosForUser,
  mapAccountDtoToFinanceAccount,
  toCreateAccountRequestBody,
} from '../mappers/accountMappers';

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
  /** Requires non-blank userId and a valid token; otherwise leaves accounts empty and does not call the API. */
  loadAccounts: (userId: string) => Promise<void>;
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
          await api.post('/accounts', toCreateAccountRequestBody(account));
          await get().loadAccounts(uid);
          set({ isLoading: false, error: null });
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudo crear la cuenta';
          set({ error: msg, isLoading: false });
          throw caught;
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
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudo eliminar la cuenta';
          set({ error: msg, isLoading: false });
          throw caught;
        }
      },
      loadAccounts: async (userId: string) => {
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
    }),
    {
      name: 'finance-storage',
      partialize: state => ({
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
