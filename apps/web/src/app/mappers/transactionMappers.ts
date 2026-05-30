import type {
  TransactionDto,
  CreateTransactionRequestBody,
  UpdateTransactionRequestBody,
  TransactionTypeDto,
} from '../types/api/transactions';
import type { Transaction, TransactionType } from '../types/finance';
import type { CategoryDto } from '../types/api/categories';

const TYPE_FROM_DTO: Record<TransactionTypeDto, TransactionType> = {
  Income: 'income',
  Expense: 'expense',
  Transfer: 'transfer',
};

const TYPE_TO_DTO: Record<TransactionType, TransactionTypeDto> = {
  income: 'Income',
  expense: 'Expense',
  transfer: 'Transfer',
};

export function mapTransactionDtoToTransaction(dto: TransactionDto): Transaction {
  return {
    id: dto.id,
    fromAccountId: dto.fromAccountId,
    type: TYPE_FROM_DTO[dto.type] ?? 'expense',
    category: dto.categoryName ?? 'Otros',
    categoryId: dto.categoryId ?? undefined,
    categoryColor: dto.categoryColor ?? undefined,
    categoryKeyIcon: dto.categoryKeyIcon ?? undefined,
    amount: dto.amount,
    description: dto.description ?? '',
    date: dto.date.split('T')[0],
    createdAt: dto.createdAt,
    toAccountId: dto.toAccountId ?? undefined,
  };
}

function resolveCategoryId(
  type: TransactionType,
  categoryName: string,
  existingCategoryId: string | undefined,
  categories: CategoryDto[],
): string | null {
  if (type === 'transfer') return null;
  if (existingCategoryId) return existingCategoryId;
  return categories.find(c => c.name === categoryName && c.isActive)?.id ?? null;
}

export function toCreateTransactionRequestBody(
  tx: Omit<Transaction, 'id' | 'createdAt'>,
  categories: CategoryDto[],
): CreateTransactionRequestBody {
  return {
    fromAccountId: tx.fromAccountId,
    type: TYPE_TO_DTO[tx.type],
    categoryId: resolveCategoryId(tx.type, tx.category, tx.categoryId, categories),
    amount: tx.amount,
    description: tx.description || null,
    date: `${tx.date}T00:00:00Z`,
    toAccountId: tx.toAccountId ?? null,
  };
}

export function toUpdateTransactionRequestBody(
  tx: Omit<Transaction, 'id' | 'createdAt'>,
  categories: CategoryDto[],
): UpdateTransactionRequestBody {
  return {
    amount: tx.amount,
    categoryId: resolveCategoryId(tx.type, tx.category, tx.categoryId, categories),
    transactionDate: `${tx.date}T00:00:00`,
    description: tx.description || null,
    fromAccountId: tx.fromAccountId,
  };
}
