export interface Franchise {
  id: number;
  business_name: string;
  contact_person: string;
  email: string;
  phone: string;
  location: string;
  city: string;
  state: string;
  investment_capacity?: number;
  experience_years?: number;
  business_background?: string;
  why_franchise?: string;
  status: number; // 1=New, 2=Contacted, 3=In Discussion, 4=Approved, 5=Rejected
  notes?: string;
  assigned_to?: number;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateFranchiseStatusRequest {
  id: number;
  status: number;
  notes?: string;
  assigned_to?: number;
}

export interface FranchiseSearchFilters {
  status?: number;
  assigned_to?: number;
  city?: string;
  state?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  investment_capacity_min?: number;
  investment_capacity_max?: number;
}

export interface FranchiseListResponse {
  franchiseInquiries: Franchise[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FranchiseInquiry {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  investment_budget?: number;
  business_experience?: string;
  message?: string;
  created_at: string;
  updated_at: string;
} 