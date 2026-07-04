import { api } from '@/app/lib';
import type { UserDto, UpdateProfileRequestBody, ChangePasswordRequestBody } from '@/app/types/api';

export function getMe(): Promise<UserDto> {
  return api.get<UserDto>('/users/me');
}

export function updateProfile(body: UpdateProfileRequestBody): Promise<UserDto> {
  return api.patch<UserDto>('/users/me', body);
}

export function changePassword(body: ChangePasswordRequestBody): Promise<void> {
  return api.post<void>('/users/me/change-password', body);
}

export function deactivateMyAccount(): Promise<void> {
  return api.delete<void>('/users/me');
}
