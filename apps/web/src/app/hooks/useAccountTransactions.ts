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
import type { TransactionSummaryDto, TransactionQueryParams } from '../types/api/transactions';
import { PAGE_SIZE, TYPE_TO_DTO } from './useTransactionsPaginated';

export interface AccountTransactionFilters {
  search: string;
  type: 'all' | 'income' | 'expense' | 'transfer';
  categoryId: string;
  month: string;
}

const ALL_PAGES_PAGE_SIZE = 100;

function buildParams(
  accountId: string,
  filters: AccountTransactionFilters,
  debouncedSearch: string,
  page: number,
): TransactionQueryParams {
  const params: TransactionQueryParams = { page, pageSize: PAGE_SIZE, fromAccountId: accountId };

  if (debouncedSearch.trim()) params.description = debouncedSearch.trim();
  if (filters.type !== 'all') params.type = TYPE_TO_DTO[filters.type];
  if (filters.categoryId !== 'all') params.categoryId = filters.categoryId;

  if (filters.month) {
    const [year, month] = filters.month.split('-').map(Number);
    params.year = year;
    params.month = month;
  }

  return params;
}

async function fetchAllPages(accountId: string): Promise<Transaction[]> {
  const first = await listTransactions({ fromAccountId: accountId, page: 1, pageSize: ALL_PAGES_PAGE_SIZE });
  const allDtos = [...first.items];

  if (first.totalPages > 1) {
    const rest = await Promise.all(
      Array.from({ length: first.totalPages - 1 }, (_, i) =>
        listTransactions({ fromAccountId: accountId, page: i + 2, pageSize: ALL_PAGES_PAGE_SIZE })
      )
    );
    rest.forEach(r => allDtos.push(...r.items));
  }

  return allDtos.map(mapTransactionDtoToTransaction);
}

export function useAccountTransactions(accountId: string) {
  const categories = useFinanceStore(s => s.categories);
  const listAccounts = useFinanceStore(s => s.listAccounts);
  const loadUserBalance = useFinanceStore(s => s.loadUserBalance);
  const loadCategories = useFinanceStore(s => s.loadCategories);

  const [filters, setFiltersState] = useState<AccountTransactionFilters>({
    search: '',
    type: 'all',
    categoryId: 'all',
    month: '',
  });

  const [page, setPageState] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Paginated list (current page)
  const [items, setItems] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummaryDto | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // All pages (for analytics: chart, category breakdown)
  const [allItems, setAllItems] = useState<Transaction[]>([]);
  const [allItemsLoading, setAllItemsLoading] = useState(false);

  // Reset on accountId change
  useEffect(() => {
    setPageState(1);
    setFiltersState({ search: '', type: 'all', categoryId: 'all', month: '' });
  }, [accountId]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
      setPageState(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const setFilter = useCallback(<K extends keyof AccountTransactionFilters>(
    key: K,
    value: AccountTransactionFilters[K],
  ) => {
    setFiltersState(prev => ({ ...prev, [key]: value }));
    if (key !== 'search') setPageState(1);
  }, []);

  const setPage = useCallback((p: number) => setPageState(p), []);

  // Load categories on mount
  useEffect(() => {
    const load = () => {
      if (!useAuthStore.persist.hasHydrated()) return;
      void loadCategories();
    };
    if (useAuthStore.persist.hasHydrated()) load();
    return useAuthStore.persist.onFinishHydration(load);
  }, [loadCategories]);

  // Paginated fetch (respects filters, page)
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!accountId || !getAuthToken()) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    const params = buildParams(accountId, filters, debouncedSearch, page);
    const { page: _p, pageSize: _ps, ...summaryParams } = params;

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
  }, [accountId, filters.type, filters.categoryId, filters.month, debouncedSearch, page, refreshKey]);

  // All-pages fetch (no filters — for chart and category breakdown)
  useEffect(() => {
    if (!accountId || !getAuthToken()) return;

    setAllItemsLoading(true);
    fetchAllPages(accountId)
      .then(all => {
        setAllItems(all);
        setAllItemsLoading(false);
      })
      .catch(() => setAllItemsLoading(false));
  }, [accountId, refreshKey]);

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
    // Paginated list
    items,
    page,
    totalPages,
    setPage,
    filters,
    setFilter,
    isLoading,
    error,
    // Summary (filtered totals)
    summary,
    // All transactions (for analytics)
    allItems,
    allItemsLoading,
    // Shared
    categories,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
