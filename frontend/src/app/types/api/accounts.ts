import { AccountType } from "@/app/types/enums";

export interface AccountDto {
  id: string;
  userId: string;
  name: string | null;
  type: AccountType;
  initialBalance: number;
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
