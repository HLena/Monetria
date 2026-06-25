export interface BudgetDto {
  id: string;
  userId: string;
  categoryId: string;
  limitAmount: number;
  month: number;
  year: number;
  rolloverUnused: boolean;
  spentAmount: number;
  createdAt: string;
}

export interface CreateBudgetRequestBody {
  categoryId: string;
  limitAmount: number;
  month: number;
  year: number;
  rolloverUnused: boolean;
}

export interface UpdateBudgetRequestBody {
  categoryId: string;
  limitAmount: number;
  month: number;
  year: number;
  rolloverUnused: boolean;
}
