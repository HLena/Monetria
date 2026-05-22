import { AccountType } from "@/app/types/enums";

export interface AccountDto {
  id: string;
  userId: string;
  name: string | null;
  type: AccountType;
  currentBalance: number;
  currencyCode: string;
  colorCode: string;
  institutionName?: string | null;
  cardHolderName?: string | null;
  cardLast4Digits?: string | null;
  creditLimit: number | null;
  statementClosingDay?: number | null;
  paymentDueDay?: number | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface UserBalanceDto {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  currencyCode: string;
}
