export interface Admin {
  id: number;
  email: string;
  phone: string;
  password: string;
  name: string;
  status: number; // 1=Active, 2=Inactive
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  admin: Omit<Admin, 'password'>;
}

export interface CreateAdminRequest {
  email: string;
  phone: string;
  password: string;
  name: string;
  status?: number;
}

export interface UpdateAdminRequest {
  id: number;
  email?: string;
  phone?: string;
  name?: string;
  status?: number;
}

export interface ChangePasswordRequest {
  id: number;
  current_password: string;
  new_password: string;
} 