import { api } from '@/app/lib';
import type { CategoryDto, CategoryTypeDto } from '@/app/types/api';

export function listCategories(includeInactive = false): Promise<CategoryDto[]> {
  const qs = includeInactive ? '?includeInactive=true' : '';
  return api.get<CategoryDto[]>(`/categories${qs}`);
}

export function createCategory(body: { name: string; type: CategoryTypeDto; color?: string; keyIcon?: string }): Promise<CategoryDto> {
  return api.post<CategoryDto>('/categories', body);
}

export function updateCategory(id: string, body: { name: string; color?: string; keyIcon?: string }): Promise<CategoryDto> {
  return api.patch<CategoryDto>(`/categories/${id}`, body);
}

export function deactivateCategory(id: string): Promise<CategoryDto> {
  return api.patch<CategoryDto>(`/categories/${id}/deactivate`, {});
}

export function activateCategory(id: string): Promise<CategoryDto> {
  return api.patch<CategoryDto>(`/categories/${id}/activate`, {});
}
