import { AccountType } from "@monetria/enums";

// Returned by GET /accounts (list)
export interface AccountSummaryDto {
  id: string;
  userId: string;
  name: string | null;
  type: AccountType;
  currentBalance: number;
  currencyCode: string;
  colorCode: string;
  institutionName?: string | null;
  creditLimit: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Returned by GET /accounts/{id}, POST /accounts, PUT /accounts/{id}
export interface AccountDetailDto extends AccountSummaryDto {
  cardHolderName?: string | null;
  cardLast4Digits?: string | null;
  statementClosingDay?: number | null;
  paymentDueDay?: number | null;
}

// Backward-compatible alias used where we don't need to distinguish
export type AccountDto = AccountDetailDto;

export interface UserBalanceDto {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  currencyCode: string;
}
