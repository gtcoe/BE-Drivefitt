export interface Career {
  id: number;
  title: string;
  description: string;
  location: string;
  job_type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  experience_level: 'Entry' | 'Mid' | 'Senior' | 'Executive';
  salary_range?: string;
  requirements: string;
  responsibilities: string;
  benefits?: string;
  status: number; // 1=Active, 2=Inactive, 3=Draft
  posted_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCareerRequest {
  title: string;
  description: string;
  location: string;
  job_type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  experience_level: 'Entry' | 'Mid' | 'Senior' | 'Executive';
  salary_range?: string;
  requirements: string;
  responsibilities: string;
  benefits?: string;
  status?: number;
}

export interface UpdateCareerRequest extends Partial<CreateCareerRequest> {
  id: number;
}

export interface CareerSearchFilters {
  location?: string;
  job_type?: string;
  experience_level?: string;
  status?: number;
  posted_by?: number;
  search?: string; // For title/description search
}

export interface CareerListResponse {
  careers: Career[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} 