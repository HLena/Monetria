export interface UserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  preferredCurrency: string;
  dateFormat: string;
  theme: string;
  phoneNumber: string | null;
}

export interface UpdateProfileRequestBody {
  firstName: string;
  lastName: string;
  preferredCurrency?: string;
  dateFormat?: string;
  theme?: string;
  phoneNumber?: string | null;
}

export interface UpdatePreferencesRequestBody {
  preferredCurrency?: string;
  theme?: string;
  dateFormat?: string;
}

export interface ChangePasswordRequestBody {
  currentPassword: string;
  newPassword: string;
}
