export type AccountType = 'credit' | 'debit' | 'cash';
export type TransactionType = 'income' | 'expense';
export type BudgetPeriod = 'monthly' | 'weekly';
export type FixedExpensePeriod = 'monthly' | 'weekly' | 'yearly';
export type DebtType = 'personal_loan' | 'credit_card' | 'mortgage' | 'auto_loan' | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  cardNumber?: string; // Last 4 digits
  cardHolder?: string;
  expiryDate?: string; // MM/YY
  bank?: string;
  initialBalance: number; // credit: amount owed (positive); debit/cash: available (positive)
  creditLimit?: number;
  billingDate?: number; // day 1-31
  paymentDate?: number; // day 1-31
  color: string;
  currency: string;
  createdAt: string;
}

export const EXPENSE_CATEGORIES = [
  'Alimentación',
  'Transporte',
  'Entretenimiento',
  'Salud',
  'Educación',
  'Servicios',
  'Tecnología',
  'Ropa',
  'Hogar',
  'Viajes',
  'Restaurantes',
  'Otros',
] as const;

export const INCOME_CATEGORIES = [
  'Salario',
  'Freelance',
  'Inversiones',
  'Ventas',
  'Bonos',
  'Otros',
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Alimentación: '#f59e0b',
  Transporte: '#3b82f6',
  Entretenimiento: '#8b5cf6',
  Salud: '#10b981',
  Educación: '#06b6d4',
  Servicios: '#6366f1',
  Tecnología: '#ec4899',
  Ropa: '#f97316',
  Hogar: '#84cc16',
  Viajes: '#14b8a6',
  Restaurantes: '#ef4444',
  Otros: '#94a3b8',
  Salario: '#10b981',
  Freelance: '#6366f1',
  Inversiones: '#f59e0b',
  Ventas: '#3b82f6',
  Bonos: '#8b5cf6',
};

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];

export function fixedExpenseMonthlyEquivalent(amount: number, period: FixedExpensePeriod): number {
  switch (period) {
    case 'monthly':
      return amount;
    case 'weekly':
      return (amount * 52) / 12;
    case 'yearly':
      return amount / 12;
    default:
      return amount;
  }
}

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  category: string;
  amount: number; // Always positive
  description: string;
  date: string; // ISO date string YYYY-MM-DD
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  period: BudgetPeriod;
  color: string;
  createdAt: string;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  accountId: string;
  period: FixedExpensePeriod;
  /** Día del mes (1–31) en que suele cargarse; opcional */
  dueDay?: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  color: string;
  description?: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  name: string;
  creditor: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate: number; // Annual %
  minimumPayment: number;
  dueDate: string;
  type: DebtType;
  color: string;
  createdAt: string;
}
