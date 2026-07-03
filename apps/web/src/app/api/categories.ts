import { api } from '@/app/lib';
import type { CategoryDto } from '@/app/types/api';

export async function listCategories(): Promise<CategoryDto[]> {
  return api.get<CategoryDto[]>('/categories');
}
