import { api } from '../lib/apiClient';
import type { CategoryDto } from '../types/api/categories';

export async function listCategories(): Promise<CategoryDto[]> {
  return api.get<CategoryDto[]>('/categories');
}
