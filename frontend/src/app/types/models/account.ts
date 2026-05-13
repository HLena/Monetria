import { AccountType } from '@/app/types/enums';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  cardLast4Digits?: string; // Last 4 digits
  cardHolderName?: string;
  expiryDate?: string; // MM/YY
  institutionName?: string;
  initialBalance: number; // credit: amount owed (positive); debit/cash: available (positive)
  creditLimit?: number;
  statementClosingDay?: number; // day 1-31
  paymentDueDay?: number; // day 1-31
  colorCode: string;
  currencyCode: string;
  createdAt: string;
}
