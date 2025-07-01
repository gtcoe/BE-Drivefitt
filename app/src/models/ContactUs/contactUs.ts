export interface ContactUs {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  message: string;
  created_at: string;
  updated_at: string;
}

export interface ContactUsSearchFilters {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export interface ContactUsListResponse {
  contactUs: ContactUs[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} 