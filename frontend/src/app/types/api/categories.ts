export type CategoryTypeDto = 'Income' | 'Expense' | 'Transfer';

export interface CategoryDto {
  id: string;
  userId: string | null;
  name: string;
  type: CategoryTypeDto;
  isDefault: boolean;
  isActive: boolean;
  color: string | null;
  keyIcon: string | null;
  createdAt: string;
  updatedAt: string;
}
