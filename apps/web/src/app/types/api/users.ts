export interface UserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  preferredCurrency: string;
  dateFormat: string;
}

export interface UpdateProfileRequestBody {
  firstName: string;
  lastName: string;
  preferredCurrency?: string;
  dateFormat?: string;
}

export interface ChangePasswordRequestBody {
  currentPassword: string;
  newPassword: string;
}
