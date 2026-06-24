import { useState, useEffect, useCallback, useRef } from 'react';
import { useFinanceStore } from '../store/FinanceStore';
import { useAuthStore } from '../store/AuthStore';
import { getAuthToken } from '../lib/apiClient';
import {
  listTransactions,
  getTransactionsSummary,
  createTransaction as createTransactionApi,
  updateTransaction as updateTransactionApi,
  deleteTransaction as deleteTransactionApi,
} from '../api/transactions';
import {
  mapTransactionDtoToTransaction,
  toCreateTransactionRequestBody,
  toUpdateTransactionRequestBody,
} from '../mappers/transactionMappers';
import type { Transaction } from '../types/finance';
import type { TransactionSummaryDto, TransactionQueryParams, TransactionTypeDto } from '../types/api/transactions';
import { getCurrentMonthKey } from '../store/FinanceContext';

export const PAGE_SIZE = 10;

export interface TransactionFilters {
  search: string;
  type: 'all' | 'income' | 'expense' | 'transfer';
  categoryId: string;
  accountId: string;
  month: string;
}

export const TYPE_TO_DTO: Record<string, TransactionTypeDto | undefined> = {
  income: 'Income',
  expense: 'Expense',
  transfer: 'Transfer',
  all: undefined,
};

function buildParams(filters: TransactionFilters, debouncedSearch: string, page: number): TransactionQueryParams {
  const params: TransactionQueryParams = { page, pageSize: PAGE_SIZE };

  if (debouncedSearch.trim()) params.description = debouncedSearch.trim();
  if (filters.type !== 'all') params.type = TYPE_TO_DTO[filters.type];
  if (filters.categoryId !== 'all') params.categoryId = filters.categoryId;
  if (filters.accountId !== 'all') params.fromAccountId = filters.accountId;

  if (filters.month) {
    const [year, month] = filters.month.split('-').map(Number);
    params.year = year;
    params.month = month;
  }

  return params;
}

function buildSummaryParams(filters: TransactionFilters, debouncedSearch: string): Omit<TransactionQueryParams, 'page' | 'pageSize'> {
  const { page: _p, pageSize: _ps, ...rest } = buildParams(filters, debouncedSearch, 1);
  return rest;
}

export function useTransactionsPaginated() {
  const accounts = useFinanceStore(s => s.accounts);
  const categories = useFinanceStore(s => s.categories);
  const listAccounts = useFinanceStore(s => s.listAccounts);
  const loadUserBalance = useFinanceStore(s => s.loadUserBalance);
  const loadCategories = useFinanceStore(s => s.loadCategories);

  const [filters, setFiltersState] = useState<TransactionFilters>({
    search: '',
    type: 'all',
    categoryId: 'all',
    accountId: 'all',
    month: getCurrentMonthKey(),
  });

  const [page, setPageState] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [items, setItems] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummaryDto | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
      setPageState(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const setFilter = useCallback(<K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) => {
    setFiltersState(prev => ({ ...prev, [key]: value }));
    if (key !== 'search') setPageState(1);
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

    const params = buildParams(filters, debouncedSearch, page);
    const summaryParams = buildSummaryParams(filters, debouncedSearch);

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
  }, [filters.type, filters.categoryId, filters.accountId, filters.month, debouncedSearch, page, refreshKey]);

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
