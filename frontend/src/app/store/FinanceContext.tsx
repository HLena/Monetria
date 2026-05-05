import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Account,
  Transaction,
  Budget,
  SavingsGoal,
  Debt,
  FixedExpense,
} from '../types/finance';

const genId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

// ─── Storage migration ────────────────────────────────────────────────────────

const STORAGE_VERSION = '2';
const FINANCE_KEYS = ['fin_accounts', 'fin_transactions', 'fin_budgets', 'fin_fixed_expenses', 'fin_savings', 'fin_debts'];

function clearStaleFinanceData(): void {
  if (localStorage.getItem('fin_version') !== STORAGE_VERSION) {
    FINANCE_KEYS.forEach(key => localStorage.removeItem(key));
    localStorage.setItem('fin_version', STORAGE_VERSION);
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface FinanceContextType {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  fixedExpenses: FixedExpense[];
  savingsGoals: SavingsGoal[];
  debts: Debt[];

  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addBudget: (budget: Omit<Budget, 'id' | 'createdAt'>) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  addFixedExpense: (item: Omit<FixedExpense, 'id' | 'createdAt'>) => void;
  updateFixedExpense: (id: string, updates: Partial<FixedExpense>) => void;
  deleteFixedExpense: (id: string) => void;

  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;

  addDebt: (debt: Omit<Debt, 'id' | 'createdAt'>) => void;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  clearStaleFinanceData();

  const [accounts, setAccounts] = useState<Account[]>(() =>
    loadFromStorage('fin_accounts', [])
  );
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadFromStorage('fin_transactions', [])
  );
  const [budgets, setBudgets] = useState<Budget[]>(() =>
    loadFromStorage('fin_budgets', [])
  );
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>(() =>
    loadFromStorage('fin_fixed_expenses', [])
  );
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() =>
    loadFromStorage('fin_savings', [])
  );
  const [debts, setDebts] = useState<Debt[]>(() =>
    loadFromStorage('fin_debts', [])
  );

  useEffect(() => { saveToStorage('fin_accounts', accounts); }, [accounts]);
  useEffect(() => { saveToStorage('fin_transactions', transactions); }, [transactions]);
  useEffect(() => { saveToStorage('fin_budgets', budgets); }, [budgets]);
  useEffect(() => { saveToStorage('fin_fixed_expenses', fixedExpenses); }, [fixedExpenses]);
  useEffect(() => { saveToStorage('fin_savings', savingsGoals); }, [savingsGoals]);
  useEffect(() => { saveToStorage('fin_debts', debts); }, [debts]);

  // Accounts
  const addAccount = (account: Omit<Account, 'id' | 'createdAt'>) =>
    setAccounts(prev => [...prev, { ...account, id: genId(), createdAt: new Date().toISOString() }]);
  const updateAccount = (id: string, updates: Partial<Account>) =>
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  const deleteAccount = (id: string) =>
    setAccounts(prev => prev.filter(a => a.id !== id));

  // Transactions
  const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt'>) =>
    setTransactions(prev => [...prev, { ...tx, id: genId(), createdAt: new Date().toISOString() }]);
  const updateTransaction = (id: string, updates: Partial<Transaction>) =>
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  const deleteTransaction = (id: string) =>
    setTransactions(prev => prev.filter(t => t.id !== id));

  // Budgets
  const addBudget = (budget: Omit<Budget, 'id' | 'createdAt'>) =>
    setBudgets(prev => [...prev, { ...budget, id: genId(), createdAt: new Date().toISOString() }]);
  const updateBudget = (id: string, updates: Partial<Budget>) =>
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  const deleteBudget = (id: string) =>
    setBudgets(prev => prev.filter(b => b.id !== id));

  const addFixedExpense = (item: Omit<FixedExpense, 'id' | 'createdAt'>) =>
    setFixedExpenses(prev => [...prev, { ...item, id: genId(), createdAt: new Date().toISOString() }]);
  const updateFixedExpense = (id: string, updates: Partial<FixedExpense>) =>
    setFixedExpenses(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  const deleteFixedExpense = (id: string) =>
    setFixedExpenses(prev => prev.filter(f => f.id !== id));

  // Savings Goals
  const addSavingsGoal = (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) =>
    setSavingsGoals(prev => [...prev, { ...goal, id: genId(), createdAt: new Date().toISOString() }]);
  const updateSavingsGoal = (id: string, updates: Partial<SavingsGoal>) =>
    setSavingsGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  const deleteSavingsGoal = (id: string) =>
    setSavingsGoals(prev => prev.filter(g => g.id !== id));

  // Debts
  const addDebt = (debt: Omit<Debt, 'id' | 'createdAt'>) =>
    setDebts(prev => [...prev, { ...debt, id: genId(), createdAt: new Date().toISOString() }]);
  const updateDebt = (id: string, updates: Partial<Debt>) =>
    setDebts(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  const deleteDebt = (id: string) =>
    setDebts(prev => prev.filter(d => d.id !== id));

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        transactions,
        budgets,
        fixedExpenses,
        savingsGoals,
        debts,
        addAccount, updateAccount, deleteAccount,
        addTransaction, updateTransaction, deleteTransaction,
        addBudget, updateBudget, deleteBudget,
        addFixedExpense, updateFixedExpense, deleteFixedExpense,
        addSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
        addDebt, updateDebt, deleteDebt,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}

// ─── Utility helpers ─────────────────────────────────────────────────────────

export function formatCurrency(amount: number, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount);
}

export function getMonthKey(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getCurrentMonthKey() {
  return getMonthKey(new Date());
}
