export interface Contact {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: number; // 1=New, 2=In Progress, 3=Resolved, 4=Closed
  response?: string;
  responded_by?: number;
  responded_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateContactStatusRequest {
  id: number;
  status: number;
  response?: string;
}

export interface ContactSearchFilters {
  status?: number;
  responded_by?: number;
  search?: string; // For name/email/subject search
  date_from?: string;
  date_to?: string;
}

export interface ContactListResponse {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} 