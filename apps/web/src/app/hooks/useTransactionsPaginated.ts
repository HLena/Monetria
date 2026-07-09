import { useState, useEffect, useCallback, useRef } from 'react';
import { useFinanceStore, useAuthStore } from '@/app/store';
import { getAuthToken } from '@/app/lib';
import {
  listTransactions,
  getTransactionsSummary,
  createTransaction as createTransactionApi,
  updateTransaction as updateTransactionApi,
  deleteTransaction as deleteTransactionApi,
} from '@/app/api';
import {
  mapTransactionDtoToTransaction,
  toCreateTransactionRequestBody,
  toUpdateTransactionRequestBody,
} from '@/app/mappers';
import type { Transaction } from '@/app/types/finance';
import type { TransactionSummaryDto, TransactionQueryParams, TransactionTypeDto } from '@/app/types/api';

export const PAGE_SIZE = 10;

export interface TransactionFilters {
  type: 'all' | 'income' | 'expense' | 'transfer';
  categoryId: string;
  accountId: string;
  startDate: string;
  endDate: string;
}

export const TYPE_TO_DTO: Record<string, TransactionTypeDto | undefined> = {
  income: 'Income',
  expense: 'Expense',
  transfer: 'Transfer',
  all: undefined,
};

function buildParams(filters: TransactionFilters, page: number): TransactionQueryParams {
  const params: TransactionQueryParams = { page, pageSize: PAGE_SIZE };

  if (filters.type !== 'all') params.type = TYPE_TO_DTO[filters.type];
  if (filters.categoryId !== 'all') params.categoryId = filters.categoryId;
  if (filters.accountId !== 'all') params.fromAccountId = filters.accountId;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;

  return params;
}

function buildSummaryParams(filters: TransactionFilters): Omit<TransactionQueryParams, 'page' | 'pageSize'> {
  const { page: _p, pageSize: _ps, ...rest } = buildParams(filters, 1);
  return rest;
}

export function useTransactionsPaginated() {
  const accounts = useFinanceStore(s => s.accounts);
  const categories = useFinanceStore(s => s.categories);
  const listAccounts = useFinanceStore(s => s.listAccounts);
  const loadUserBalance = useFinanceStore(s => s.loadUserBalance);
  const loadCategories = useFinanceStore(s => s.loadCategories);

  const [filters, setFiltersState] = useState<TransactionFilters>({
    type: 'all',
    categoryId: 'all',
    accountId: 'all',
    startDate: '',
    endDate: '',
  });

  const [page, setPageState] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [items, setItems] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummaryDto | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setFilter = useCallback(<K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) => {
    setFiltersState(prev => ({ ...prev, [key]: value }));
    setPageState(1);
  }, []);

  const setPage = useCallback((p: number) => setPageState(p), []);

  // Load accounts + categories on mount
  useEffect(() => {
    const load = () => {
      if (!useAuthStore.persist.hasHydrated()) return;
      const userId = useAuthStore.getState().user?.userId ?? '';
      void listAccounts(userId);
      void loadCategories();
    };
    if (useAuthStore.persist.hasHydrated()) load();
    return useAuthStore.persist.onFinishHydration(load);
  }, [listAccounts, loadCategories]);

  // Fetch paginated data + summary whenever filters / page / refreshKey change
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!getAuthToken()) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    const params = buildParams(filters, page);
    const summaryParams = buildSummaryParams(filters);

    Promise.all([listTransactions(params), getTransactionsSummary(summaryParams)])
      .then(([listResult, summaryResult]) => {
        setItems(listResult.items.map(mapTransactionDtoToTransaction));
        setTotalPages(Math.ceil(listResult.totalCount / PAGE_SIZE));
        setSummary(summaryResult);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Error al cargar transacciones');
        setIsLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.type, filters.categoryId, filters.accountId, filters.startDate, filters.endDate, page, refreshKey]);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const userId = useAuthStore(s => s.user?.userId ?? '');

  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const body = toCreateTransactionRequestBody(tx, categories);
    await createTransactionApi(body);
    void listAccounts(userId).catch(() => undefined);
    void loadUserBalance().catch(() => undefined);
    refresh();
  }, [categories, listAccounts, loadUserBalance, userId, refresh]);

  const updateTransaction = useCallback(async (id: string, tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const body = toUpdateTransactionRequestBody(tx, categories);
    await updateTransactionApi(id, body);
    void listAccounts(userId).catch(() => undefined);
    void loadUserBalance().catch(() => undefined);
    refresh();
  }, [categories, listAccounts, loadUserBalance, userId, refresh]);

  const deleteTransaction = useCallback(async (id: string) => {
    await deleteTransactionApi(id);
    void listAccounts(userId).catch(() => undefined);
    void loadUserBalance().catch(() => undefined);
    refresh();
  }, [listAccounts, loadUserBalance, userId, refresh]);

  return {
    items,
    summary,
    page,
    totalPages,
    setPage,
    filters,
    setFilter,
    isLoading,
    error,
    accounts,
    categories,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
