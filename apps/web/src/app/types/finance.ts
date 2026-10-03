export { AccountType } from '@monetria/enums';
export type { Account } from '@/app/types/models';
import type {
  RecurringType,
  RecurringAmountType,
  RecurringFrequency,
  RecurringOccurrenceStatus,
} from './api/recurrings';

export type TransactionType = 'income' | 'expense' | 'transfer';
export type BudgetPeriod = 'monthly' | 'weekly';
export type DebtType = 'personal_loan' | 'credit_card' | 'mortgage' | 'auto_loan' | 'other';
export type Currency = 'PEN' | 'USD';

export type { RecurringType, RecurringAmountType, RecurringFrequency, RecurringOccurrenceStatus };

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  PEN: 'S/',
  USD: '$',
};

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

export function recurringMonthlyEquivalent(amount: number, frequency: RecurringFrequency): number {
  switch (frequency) {
    case 'Daily':
      return amount * 30;
    case 'Weekly':
      return (amount * 52) / 12;
    case 'Biweekly':
      return (amount * 26) / 12;
    case 'Monthly':
      return amount;
    case 'Yearly':
      return amount / 12;
    default:
      return amount;
  }
}

export interface Transaction {
  id: string;
  fromAccountId: string;
  type: TransactionType;
  category: string;
  categoryId?: string;
  categoryColor?: string;
  categoryKeyIcon?: string;
  amount: number; // Always positive
  description: string;
  date: string; // ISO date string YYYY-MM-DD
  createdAt: string;
  toAccountId?: string;
  currency?: Currency;
}

export interface Budget {
  id: string;
  categoryId: string;
  limitAmount: number;
  month: number;
  year: number;
  spentAmount: number;
  isRecurring: boolean;
  createdAt: string;
}

export interface Recurring {
  id: string;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  categoryName?: string;
  name: string;
  type: RecurringType;
  amountType: RecurringAmountType;
  amount?: number;
  estimatedAmount?: number;
  frequency: RecurringFrequency;
  startDate: string; // 'YYYY-MM-DD'
  endDate?: string;
  nextDueDate: string;
  isActive: boolean;
}

export interface RecurringOccurrence {
  id: string;
  recurringId: string;
  scheduledDate: string;
  status: RecurringOccurrenceStatus;
  suggestedAmount?: number;
  realAmount?: number;
  transactionId?: string;
  confirmedAt?: string;
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
