import { AccountType } from '@monetria/enums';
import type { TransactionDto } from './transactions';

export interface DashboardMonthSummary {
  month: number;
  year: number;
  income: number;
  expenses: number;
  balance: number;
}

export interface DashboardAccountEntry {
  id: string;
  name: string | null;
  type: AccountType;
  balance: number;
  currencyCode: string;
  colorCode: string;
  institutionName: string | null;
}

export interface DashboardBudgetEntry {
  id: string;
  categoryId: string;
  limitAmount: number;
  spentAmount: number;
  month: number;
  year: number;
  isRecurring: boolean;
}

export interface DashboardRecurringEntry {
  id: string;
  name: string;
  type: string;
  amountType: string;
  amount: number | null;
  estimatedAmount: number | null;
  frequency: string;
  nextDueDate: string;
  categoryId: string | null;
  categoryName: string | null;
}

export interface DashboardDto {
  netWorth: number;
  creditCardDebt: number;
  currentMonth: DashboardMonthSummary;
  accounts: DashboardAccountEntry[];
  recentTransactions: TransactionDto[];
  budgets: DashboardBudgetEntry[];
  upcomingRecurrings: DashboardRecurringEntry[];
}
