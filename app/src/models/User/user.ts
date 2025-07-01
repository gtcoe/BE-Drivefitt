export interface User {
  id: number;
  email: string;
  phone?: string;
  password: string;
  first_name: string;
  last_name: string;
  date_of_birth?: Date;
  gender?: 'male' | 'female' | 'other';
  status: number; // 1=Active, 2=Inactive, 3=Suspended
  email_verified: number; // 0=false, 1=true
  phone_verified: number; // 0=false, 1=true
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserDetails {
  id: number;
  name: string;
  phone: string;
  email: string;
  dob?: string;
  gender?: 'Male' | 'Female' | 'others';
  cms_user_id?: number;
  created_at: Date;
  cms_created_at?: Date;
  otp_verified: boolean;
  source?: string;
  cms_sync_status: 'unsynced' | 'synced' | 'failed';
  last_sync_attempt?: Date;
  retry_count: number;
  metadata?: any;
}

export interface Subscription {
  subscription_id: string;
  cms_subscription_id?: string;
  user_id: string;
  cms_user_id?: number;
  plan_id: string;
  base_amount: number;
  discount_amount: number;
  total_amount: number;
  coupon_code?: string;
  discount_type?: 'percentage' | 'fixed' | 'trial';
  payment_status: 'pending' | 'paid' | 'failed';
  razorpay_order_id?: string;
  razorpay_sub_id?: string;
  rzp_invoice_id?: string;
  start_date?: Date;
  end_date?: Date;
  last_payment_date?: Date;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  cms_sync_status: 'unsynced' | 'synced' | 'failed';
  last_sync_attempt?: Date;
  retry_count: number;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export interface UserRegistrationRequest {
  email: string;
  phone?: string;
  password: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserLoginResponse {
  token: string;
  user: Omit<User, 'password'>;
}

export interface UserProfileUpdateRequest {
  id: number;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
}

export interface CreateUserDetailsRequest {
  name: string;
  phone: string;
  email: string;
  dob?: string;
  gender?: 'Male' | 'Female' | 'others';
  cms_user_id?: number;
  source?: string;
  otp_verified?: boolean;
}

export interface CreateSubscriptionRequest {
  subscription_id: string;
  user_id: string;
  cms_user_id?: number;
  plan_id: string;
  base_amount: number;
  discount_amount?: number;
  coupon_code?: string;
  discount_type?: 'percentage' | 'fixed' | 'trial';
  razorpay_order_id?: string;
}

export interface UserSearchFilters {
  email?: string;
  phone?: string;
  status?: number;
  email_verified?: number;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export interface UserListResponse {
  users: Omit<User, 'password'>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SubscriptionSearchFilters {
  user_id?: string;
  cms_user_id?: number;
  plan_id?: string;
  status?: string;
  payment_status?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export interface SubscriptionListResponse {
  subscriptions: Subscription[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} 