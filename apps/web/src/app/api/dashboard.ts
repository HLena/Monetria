import { api } from '@/app/lib';
import type { DashboardDto } from '@/app/types/api';

export async function getDashboard(): Promise<DashboardDto> {
  return api.get<DashboardDto>('/dashboard');
}
