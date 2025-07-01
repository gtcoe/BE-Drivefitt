export interface Payment {
  id: number;
  transaction_id: string;
  user_id?: number;
  user_email?: string;
  user_name?: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_gateway: string;
  gateway_transaction_id?: string;
  status: string;
  description?: string;
  metadata?: any;
  gateway_response?: any;
  refund_amount?: number;
  refund_reason?: string;
  refunded_at?: Date;
  subscription_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePaymentRequest {
  transaction_id: string;
  user_id?: number;
  user_email?: string;
  user_name?: string;
  amount: number;
  currency?: string;
  payment_method: 'card' | 'upi' | 'netbanking' | 'wallet' | 'emi';
  payment_gateway: 'razorpay' | 'stripe' | 'payu' | 'cashfree';
  gateway_transaction_id?: string;
  description?: string;
  metadata?: any;
  subscription_id?: string;
}

export interface PaymentSearchFilters {
  user_id?: number;
  user_email?: string;
  transaction_id?: string;
  status?: string;
  payment_method?: string;
  payment_gateway?: string;
  subscription_id?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export interface PaymentListResponse {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} 