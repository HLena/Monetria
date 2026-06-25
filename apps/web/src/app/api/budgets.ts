import { api } from '../lib/apiClient';
import type { BudgetDto, CreateBudgetRequestBody, UpdateBudgetRequestBody } from '../types/api/budgets';

export async function listBudgets(month?: number, year?: number): Promise<BudgetDto[]> {
  const params = new URLSearchParams();
  if (month != null) params.set('month', String(month));
  if (year != null) params.set('year', String(year));
  const qs = params.size ? `?${params}` : '';
  return api.get<BudgetDto[]>(`/budgets${qs}`);
}

export async function createBudget(body: CreateBudgetRequestBody): Promise<BudgetDto> {
  return api.post<BudgetDto>('/budgets', body);
}

export async function updateBudget(id: string, body: UpdateBudgetRequestBody): Promise<BudgetDto> {
  return api.put<BudgetDto>(`/budgets/${id}`, body);
}

export async function deleteBudget(id: string): Promise<void> {
  await api.delete(`/budgets/${id}`);
}
