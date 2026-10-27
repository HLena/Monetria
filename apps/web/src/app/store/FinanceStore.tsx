import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Account, Budget, Debt, Recurring, RecurringOccurrence, SavingsGoal, Transaction } from '@/app/types/finance';
import type { CategoryDto, CategoryTypeDto } from '@/app/types/api';
import type { UserBalanceDto } from '@/app/types/api';
import { api, getAuthToken } from '@/app/lib';
import { useAuthStore } from './AuthStore';
import { listAccounts, getAccountById, updateAccount as updateAccountApi, deleteAccount as deleteAccountApi, reactivateAccount as reactivateAccountApi, getUserBalance as getUserBalanceApi } from '@/app/api';
import {
  listCategories as listCategoriesApi,
  createCategory as createCategoryApi,
  updateCategory as updateCategoryApi,
  deleteCategory as deleteCategoryApi,
  setSystemCategoryPreference as setSystemCategoryPreferenceApi,
} from '@/app/api';
import {
  listTransactions as listTransactionsApi,
  createTransaction as createTransactionApi,
  updateTransaction as updateTransactionApi,
  deleteTransaction as deleteTransactionApi,
} from '@/app/api';
import {
  listBudgets as listBudgetsApi,
  createBudget as createBudgetApi,
  updateBudget as updateBudgetApi,
  deleteBudget as deleteBudgetApi,
} from '@/app/api';
import type { BudgetDto } from '@/app/types/api';
import type { RecurringDto, RecurringOccurrenceDto } from '@/app/types/api';
import {
  listRecurrings as listRecurringsApi,
  createRecurring as createRecurringApi,
  updateRecurring as updateRecurringApi,
  deactivateRecurring as deactivateRecurringApi,
  listRecurringOccurrences as listRecurringOccurrencesApi,
  confirmRecurringOccurrence as confirmRecurringOccurrenceApi,
  skipRecurringOccurrence as skipRecurringOccurrenceApi,
} from '@/app/api';
import {
  filterAccountDtosForUser,
  mapAccountDtoToFinanceAccount,
  toCreateAccountRequestBody,
} from '@/app/mappers';
import {
  mapTransactionDtoToTransaction,
  toCreateTransactionRequestBody,
  toUpdateTransactionRequestBody,
} from '@/app/mappers';

interface FinanceStoreState {
  isLoading: boolean;
  error: string | null;
  accounts: Account[];
  account: Account | null;
  categories: CategoryDto[];
  transactions: Transaction[];
  budgets: Budget[];
  recurrings: Recurring[];
  recurringOccurrences: Record<string, RecurringOccurrence[]>;
  savingsGoals: SavingsGoal[];
  debts: Debt[];
  userBalance: UserBalanceDto | null;
  addAccount: (account: Omit<Account, 'id'>, userId: string) => Promise<void>;
  updateAccount: (id: string, account: Omit<Account, 'id'>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  reactivateAccount: (id: string) => Promise<void>;
  /** Requires non-blank userId and a valid token; otherwise leaves accounts empty and does not call the API. */
  listAccounts: (userId: string) => Promise<void>;
  getAccountById: (id: string) => Promise<void>;
  loadCategories: () => Promise<void>;
  addCategory: (data: { name: string; type: CategoryTypeDto; color?: string; keyIcon?: string }) => Promise<void>;
  updateCategory: (id: string, data: { name: string; color?: string; keyIcon?: string }) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  toggleDefaultCategory: (id: string, currentlyActive: boolean) => Promise<void>;
  loadTransactions: () => Promise<void>;
  loadUserBalance: () => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  loadBudgets: (month?: number, year?: number) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt'>) => Promise<void>;
  updateBudget: (id: string, budget: Omit<Budget, 'id' | 'createdAt'>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  loadRecurrings: () => Promise<void>;
  addRecurring: (recurring: Omit<Recurring, 'id'>) => Promise<void>;
  updateRecurring: (id: string, recurring: Omit<Recurring, 'id'>) => Promise<void>;
  deactivateRecurring: (id: string) => Promise<void>;
  loadRecurringOccurrences: (recurringId: string) => Promise<void>;
  confirmRecurringOccurrence: (
    occurrenceId: string,
    recurringId: string,
    realAmount: number | null,
  ) => Promise<void>;
  skipRecurringOccurrence: (occurrenceId: string, recurringId: string) => Promise<void>;
}

function mapBudgetDto(dto: BudgetDto): Budget {
  return {
    id: dto.id,
    categoryId: dto.categoryId,
    limitAmount: dto.limitAmount,
    month: dto.month,
    year: dto.year,
    spentAmount: dto.spentAmount,
    isRecurring: dto.isRecurring,
    createdAt: dto.createdAt,
  };
}

function mapRecurringDto(dto: RecurringDto): Recurring {
  return {
    id: dto.id,
    accountId: dto.accountId,
    toAccountId: dto.toAccountId ?? undefined,
    categoryId: dto.categoryId ?? undefined,
    categoryName: dto.categoryName ?? undefined,
    name: dto.name,
    type: dto.type,
    amountType: dto.amountType,
    amount: dto.amount ?? undefined,
    estimatedAmount: dto.estimatedAmount ?? undefined,
    frequency: dto.frequency,
    startDate: dto.startDate,
    endDate: dto.endDate ?? undefined,
    nextDueDate: dto.nextDueDate,
    isActive: dto.isActive,
  };
}

function mapOccurrenceDto(dto: RecurringOccurrenceDto): RecurringOccurrence {
  return {
    id: dto.id,
    recurringId: dto.recurringId,
    scheduledDate: dto.scheduledDate,
    status: dto.status,
    suggestedAmount: dto.suggestedAmount ?? undefined,
    realAmount: dto.realAmount ?? undefined,
    transactionId: dto.transactionId ?? undefined,
    confirmedAt: dto.confirmedAt ?? undefined,
  };
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
      recurrings: [],
      recurringOccurrences: {},
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
          await updateAccountApi(id, account);
          await get().listAccounts(useAuthStore.getState().user?.userId ?? '');
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
          await get().listAccounts(useAuthStore.getState().user?.userId ?? '');
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudo eliminar la cuenta';
          set({ error: msg, isLoading: false });
          throw caught;
        }
      },

      reactivateAccount: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await reactivateAccountApi(id);
          await get().listAccounts(useAuthStore.getState().user?.userId ?? '');
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudo reactivar la cuenta';
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
          const dtos = await listCategoriesApi(true);
          set({ categories: dtos });
        } catch {
          // non-critical — category resolution falls back gracefully
        }
      },

      addCategory: async (data: { name: string; type: CategoryTypeDto; color?: string; keyIcon?: string }) => {
        const tempId = `temp-${Date.now()}`;
        const tempCategory: CategoryDto = {
          id: tempId,
          userId: 'pending',
          name: data.name.trim(),
          type: data.type,
          isDefault: false,
          isActive: true,
          color: data.color ?? null,
          keyIcon: data.keyIcon ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set(state => ({ categories: [...state.categories, tempCategory] }));
        try {
          const created = await createCategoryApi({
            name: data.name,
            type: data.type,
            color: data.color,
            keyIcon: data.keyIcon,
          });
          set(state => ({ categories: state.categories.map(c => (c.id === tempId ? created : c)) }));
        } catch (caught) {
          set(state => ({ categories: state.categories.filter(c => c.id !== tempId) }));
          throw caught;
        }
      },

      updateCategory: async (id: string, data: { name: string; color?: string; keyIcon?: string }) => {
        const previous = get().categories.find(c => c.id === id);
        set(state => ({
          categories: state.categories.map(c => (c.id === id ? { ...c, ...data, name: data.name.trim() } : c)),
        }));
        try {
          const updated = await updateCategoryApi(id, data);
          set(state => ({ categories: state.categories.map(c => (c.id === id ? updated : c)) }));
        } catch (caught) {
          if (previous) set(state => ({ categories: state.categories.map(c => (c.id === id ? previous : c)) }));
          throw caught;
        }
      },

      deleteCategory: async (id: string) => {
        const previous = get().categories.find(c => c.id === id);
        set(state => ({ categories: state.categories.filter(c => c.id !== id) }));
        try {
          await deleteCategoryApi(id);
        } catch (caught) {
          if (previous) set(state => ({ categories: [...state.categories, previous] }));
          throw caught;
        }
      },

      toggleDefaultCategory: async (id: string, currentlyActive: boolean) => {
        set(state => ({
          categories: state.categories.map(c => (c.id === id ? { ...c, isActive: !currentlyActive } : c)),
        }));
        try {
          await setSystemCategoryPreferenceApi(id, !currentlyActive);
        } catch {
          set(state => ({
            categories: state.categories.map(c => (c.id === id ? { ...c, isActive: currentlyActive } : c)),
          }));
        }
      },

      loadTransactions: async () => {
        set({ isLoading: true, error: null });
        if (!getAuthToken()) {
          set({ transactions: [], isLoading: false });
          return;
        }
        try {
          const { items } = await listTransactionsApi();
          set({ transactions: items.map(mapTransactionDtoToTransaction), isLoading: false, error: null });
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
          await createTransactionApi(body);
          await get().loadTransactions();
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
          await updateTransactionApi(id, body);
          await get().loadTransactions();
          void get().listAccounts(useAuthStore.getState().user?.userId ?? '').catch(() => undefined);
          void get().loadUserBalance().catch(() => undefined);
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
          await get().loadTransactions();
          void get().listAccounts(useAuthStore.getState().user?.userId ?? '').catch(() => undefined);
          void get().loadUserBalance().catch(() => undefined);
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudo eliminar la transacción';
          set({ error: msg, isLoading: false });
          throw caught;
        }
      },

      loadBudgets: async (month?: number, year?: number) => {
        if (!getAuthToken()) { set({ budgets: [] }); return; }
        set({ isLoading: true, error: null });
        try {
          const dtos = await listBudgetsApi(month, year);
          set({ budgets: dtos.map(mapBudgetDto), isLoading: false, error: null });
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudieron cargar los presupuestos';
          set({ error: msg, isLoading: false });
          throw caught;
        }
      },

      addBudget: async (budget: Omit<Budget, 'id' | 'createdAt'>) => {
        set({ isLoading: true, error: null });
        try {
          await createBudgetApi({
            categoryId: budget.categoryId,
            limitAmount: budget.limitAmount,
            month: budget.month,
            year: budget.year,
            isRecurring: budget.isRecurring,
          });
          await get().loadBudgets(budget.month, budget.year);
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudo crear el presupuesto';
          set({ error: msg, isLoading: false });
          throw caught;
        }
      },

      updateBudget: async (id: string, budget: Omit<Budget, 'id' | 'createdAt'>) => {
        set({ isLoading: true, error: null });
        try {
          await updateBudgetApi(id, {
            categoryId: budget.categoryId,
            limitAmount: budget.limitAmount,
            month: budget.month,
            year: budget.year,
            isRecurring: budget.isRecurring,
          });
          await get().loadBudgets(budget.month, budget.year);
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudo actualizar el presupuesto';
          set({ error: msg, isLoading: false });
          throw caught;
        }
      },

      deleteBudget: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await deleteBudgetApi(id);
          await get().loadBudgets();
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudo eliminar el presupuesto';
          set({ error: msg, isLoading: false });
          throw caught;
        }
      },

      loadRecurrings: async () => {
        if (!getAuthToken()) { set({ recurrings: [] }); return; }
        set({ isLoading: true, error: null });
        try {
          const { items } = await listRecurringsApi();
          set({ recurrings: items.map(mapRecurringDto), isLoading: false, error: null });
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudieron cargar los recurrentes';
          set({ error: msg, isLoading: false });
          throw caught;
        }
      },

      addRecurring: async (recurring: Omit<Recurring, 'id'>) => {
        set({ isLoading: true, error: null });
        try {
          await createRecurringApi({
            accountId: recurring.accountId,
            toAccountId: recurring.toAccountId ?? null,
            categoryId: recurring.categoryId ?? null,
            name: recurring.name,
            type: recurring.type,
            amountType: recurring.amountType,
            amount: recurring.amount ?? null,
            estimatedAmount: recurring.estimatedAmount ?? null,
            frequency: recurring.frequency,
            startDate: recurring.startDate,
            endDate: recurring.endDate ?? null,
            nextDueDate: recurring.nextDueDate,
          });
          await get().loadRecurrings();
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudo crear el recurrente';
          set({ error: msg, isLoading: false });
          throw caught;
        }
      },

      updateRecurring: async (id: string, recurring: Omit<Recurring, 'id'>) => {
        set({ isLoading: true, error: null });
        try {
          await updateRecurringApi(id, {
            accountId: recurring.accountId,
            toAccountId: recurring.toAccountId ?? null,
            categoryId: recurring.categoryId ?? null,
            name: recurring.name,
            type: recurring.type,
            amountType: recurring.amountType,
            amount: recurring.amount ?? null,
            estimatedAmount: recurring.estimatedAmount ?? null,
            frequency: recurring.frequency,
            startDate: recurring.startDate,
            endDate: recurring.endDate ?? null,
            nextDueDate: recurring.nextDueDate,
            isActive: recurring.isActive,
          });
          await get().loadRecurrings();
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudo actualizar el recurrente';
          set({ error: msg, isLoading: false });
          throw caught;
        }
      },

      deactivateRecurring: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await deactivateRecurringApi(id);
          await get().loadRecurrings();
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudo pausar el recurrente';
          set({ error: msg, isLoading: false });
          throw caught;
        }
      },

      loadRecurringOccurrences: async (recurringId: string) => {
        try {
          const dtos = await listRecurringOccurrencesApi(recurringId);
          set(state => ({
            recurringOccurrences: { ...state.recurringOccurrences, [recurringId]: dtos.map(mapOccurrenceDto) },
          }));
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudieron cargar las ocurrencias';
          set({ error: msg });
          throw caught;
        }
      },

      confirmRecurringOccurrence: async (occurrenceId: string, recurringId: string, realAmount: number | null) => {
        try {
          await confirmRecurringOccurrenceApi(occurrenceId, { realAmount });
          await get().loadRecurringOccurrences(recurringId);
          void get().listAccounts(useAuthStore.getState().user?.userId ?? '').catch(() => undefined);
          void get().loadUserBalance().catch(() => undefined);
          void get().loadTransactions().catch(() => undefined);
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudo confirmar la ocurrencia';
          set({ error: msg });
          throw caught;
        }
      },

      skipRecurringOccurrence: async (occurrenceId: string, recurringId: string) => {
        try {
          await skipRecurringOccurrenceApi(occurrenceId);
          await get().loadRecurringOccurrences(recurringId);
        } catch (caught) {
          const msg = caught instanceof Error ? caught.message : 'No se pudo omitir la ocurrencia';
          set({ error: msg });
          throw caught;
        }
      },
    }),
    {
      name: 'finance-storage',
      partialize: state => ({
        budgets: state.budgets,
        recurrings: state.recurrings,
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
