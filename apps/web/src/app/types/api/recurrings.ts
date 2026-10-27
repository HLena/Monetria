export type RecurringType = 'Income' | 'Expense' | 'Transfer';
export type RecurringAmountType = 'Fixed' | 'Estimated' | 'VariableFree';
export type RecurringFrequency = 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly' | 'Yearly';
export type RecurringOccurrenceStatus = 'Pending' | 'Confirmed' | 'Skipped' | 'AutoRegistered';

export interface RecurringDto {
  id: string;
  userId: string;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  categoryName: string | null;
  name: string;
  type: RecurringType;
  amountType: RecurringAmountType;
  amount: number | null;
  estimatedAmount: number | null;
  frequency: RecurringFrequency;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string | null;
  nextDueDate: string;
  isActive: boolean;
}

export interface RecurringListResponse {
  items: RecurringDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateRecurringRequestBody {
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  name: string;
  type: RecurringType;
  amountType: RecurringAmountType;
  amount: number | null;
  estimatedAmount: number | null;
  frequency: RecurringFrequency;
  startDate: string;
  endDate: string | null;
  nextDueDate: string;
}

export interface UpdateRecurringRequestBody extends CreateRecurringRequestBody {
  isActive: boolean;
}

export interface RecurringOccurrenceDto {
  id: string;
  recurringId: string;
  scheduledDate: string;
  status: RecurringOccurrenceStatus;
  suggestedAmount: number | null;
  realAmount: number | null;
  transactionId: string | null;
  confirmedAt: string | null;
}

export interface ConfirmOccurrenceRequestBody {
  realAmount: number | null;
}
