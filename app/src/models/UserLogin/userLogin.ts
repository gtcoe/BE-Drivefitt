export interface UserLogin {
  id: number;
  user_id?: number;
  email: string;
  device_type: string;
  device_id?: string;
  platform: string;
  app_version?: string;
  ip_address?: string;
  location?: string;
  login_time: string;
  logout_time?: string;
  session_duration?: number;
  created_at: string;
  updated_at: string;
}

export interface UserLoginSearchFilters {
  email?: string;
  device_type?: string;
  platform?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export interface UserLoginListResponse {
  userLogins: UserLogin[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} 