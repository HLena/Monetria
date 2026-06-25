export type TransactionTypeDto = 'Income' | 'Expense' | 'Transfer';

export interface TransactionResponse {
  items: TransactionDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TransactionDto {
  id: string;
  fromAccountId: string;
  type: TransactionTypeDto;
  categoryId: string | null;
  categoryName: string;
  categoryColor: string | null;
  categoryKeyIcon: string | null;
  amount: number;
  description: string | null;
  toAccountId: string | null;
  isActive: boolean;
  currencyCode: string;
  date: string;
  createdAt: string;
}

export interface CreateTransactionRequestBody {
  fromAccountId: string;
  type: TransactionTypeDto;
  categoryId: string | null;
  amount: number;
  description: string | null;
  date: string;
  toAccountId: string | null;
  currencyCode: string;
}

export interface UpdateTransactionRequestBody {
  amount: number;
  categoryId: string | null;
  transactionDate: string;
  description: string | null;
  fromAccountId: string;
  currencyCode: string;
}

export interface TransactionSummaryDto {
  totalIncome: number;
  totalExpenses: number;
  totalCount: number;
}

export interface TransactionQueryParams {
  page?: number;
  pageSize?: number;
  description?: string;
  type?: TransactionTypeDto;
  categoryId?: string;
  month?: number;
  year?: number;
  fromAccountId?: string;
}
