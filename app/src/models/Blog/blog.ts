export interface Blog {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  author_id: number;
  category?: string;
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  status: number; // 1=Published, 2=Draft, 3=Archived
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBlogRequest {
  title: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  category?: string;
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  status?: number;
  published_at?: string;
}

export interface UpdateBlogRequest {
  id: number;
  title?: string;
  content?: string;
  excerpt?: string;
  featured_image?: string;
  category?: string;
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  status?: number;
  published_at?: string;
}

export interface BlogSearchFilters {
  status?: number;
  category?: string;
  author_id?: number;
  search?: string; // For title/content search
  tags?: string[];
}

export interface BlogListResponse {
  blogs: Blog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} 