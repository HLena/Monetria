import { AccountType } from '@monetria/enums';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  cardLast4Digits?: string; // Last 4 digits
  cardHolderName?: string;
  expiryDate?: string; // MM/YY
  institutionName?: string;
  currentBalance: number; // balance derived from transactions
  initialBalance?: number; // only used when creating an account (triggers initial transaction)
  creditLimit?: number;
  statementClosingDay?: number; // day 1-31
  paymentDueDay?: number; // day 1-31
  colorCode: string;
  currencyCode: string;
  createdAt: string;
}
