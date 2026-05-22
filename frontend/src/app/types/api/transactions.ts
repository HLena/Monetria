export type TransactionTypeDto = 'Income' | 'Expense' | 'Transfer';

export interface TransactionDto {
  id: string;
  accountId: string;
  type: TransactionTypeDto;
  categoryId: string | null;
  categoryName: string;
  categoryColor: string | null;
  categoryKeyIcon: string | null;
  amount: number;
  description: string | null;
  transferAccountId: string | null;
  isActive: boolean;
  date: string;
  createdAt: string;
}

export interface CreateTransactionRequestBody {
  accountId: string;
  type: TransactionTypeDto;
  categoryId: string | null;
  amount: number;
  description: string | null;
  date: string;
  transferAccountId: string | null;
}

export interface UpdateTransactionRequestBody {
  amount: number;
  categoryId: string | null;
  transactionDate: string;
  description: string | null;
  accountId: string;
}
