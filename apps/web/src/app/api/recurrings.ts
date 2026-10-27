import { api } from '@/app/lib';
import type {
  RecurringListResponse,
  RecurringDto,
  CreateRecurringRequestBody,
  UpdateRecurringRequestBody,
  RecurringOccurrenceDto,
  ConfirmOccurrenceRequestBody,
} from '@/app/types/api';

export async function listRecurrings(
  includeInactive = true,
  page = 1,
  pageSize = 100,
): Promise<RecurringListResponse> {
  const params = new URLSearchParams({
    includeInactive: String(includeInactive),
    page: String(page),
    pageSize: String(pageSize),
  });
  return api.get<RecurringListResponse>(`/recurrings?${params}`);
}

export async function createRecurring(body: CreateRecurringRequestBody): Promise<RecurringDto> {
  return api.post<RecurringDto>('/recurrings', body);
}

export async function updateRecurring(id: string, body: UpdateRecurringRequestBody): Promise<RecurringDto> {
  return api.put<RecurringDto>(`/recurrings/${id}`, body);
}

export async function deactivateRecurring(id: string): Promise<RecurringDto> {
  return api.patch<RecurringDto>(`/recurrings/${id}/deactivate`, null);
}

export async function listRecurringOccurrences(recurringId: string): Promise<RecurringOccurrenceDto[]> {
  return api.get<RecurringOccurrenceDto[]>(`/recurrings/${recurringId}/occurrences`);
}

export async function confirmRecurringOccurrence(
  occurrenceId: string,
  body: ConfirmOccurrenceRequestBody,
): Promise<RecurringOccurrenceDto> {
  return api.patch<RecurringOccurrenceDto>(`/recurrings/occurrences/${occurrenceId}/confirm`, body);
}

export async function skipRecurringOccurrence(occurrenceId: string): Promise<RecurringOccurrenceDto> {
  return api.patch<RecurringOccurrenceDto>(`/recurrings/occurrences/${occurrenceId}/skip`, null);
}
