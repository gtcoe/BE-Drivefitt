import MySql from "../database/mySql";
import { logger } from "../logging";
import { generateError } from "../services/util";
import constants from "../config/constants/drivefitt-constants";
import { Blog, CreateBlogRequest, UpdateBlogRequest, BlogSearchFilters } from "../models/Blog/blog";

export interface BlogDBResponse {
  status: boolean;
  data?: Blog[] | null;
  message?: string;
}

export interface SingleBlogDBResponse {
  status: boolean;
  data?: Blog | null;
  message?: string;
}

export interface CountDBResponse {
  status: boolean;
  data?: { count: number } | null;
  message?: string;
}

const BlogRepository = () => {
  const tableName = constants.TABLES.BLOGS;

  const getBlogs = async (
    page: number = 1,
    limit: number = 10,
    filters: BlogSearchFilters = {}
  ): Promise<BlogDBResponse> => {
    try {
      const offset = (page - 1) * limit;
      let whereClause = "WHERE 1=1";
      const params: any[] = [];

      if (filters.status) {
        whereClause += " AND status = ?";
        params.push(filters.status);
      }

      if (filters.category) {
        whereClause += " AND category LIKE ?";
        params.push(`%${filters.category}%`);
      }

      if (filters.author_id) {
        whereClause += " AND author_id = ?";
        params.push(filters.author_id);
      }

      if (filters.search) {
        whereClause += " AND (title LIKE ? OR content LIKE ?)";
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      if (filters.tags && filters.tags.length > 0) {
        const tagConditions = filters.tags.map(() => "JSON_CONTAINS(tags, ?)").join(" AND ");
        whereClause += ` AND ${tagConditions}`;
        filters.tags.forEach(tag => params.push(`"${tag}"`));
      }

      const sql = `
        SELECT * FROM ${tableName} 
        ${whereClause} 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      params.push(limit, offset);
      
      const result = await MySql.query<Blog[]>(sql, params);
      return result;
    } catch (error) {
      logger.error(`Error in BlogRepository.getBlogs: ${generateError(error)}`);
      return { status: false, message: "Failed to fetch blogs" };
    }
  };

  const getBlogsCount = async (filters: BlogSearchFilters = {}): Promise<CountDBResponse> => {
    try {
      let whereClause = "WHERE 1=1";
      const params: any[] = [];

      if (filters.status) {
        whereClause += " AND status = ?";
        params.push(filters.status);
      }

      if (filters.category) {
        whereClause += " AND category LIKE ?";
        params.push(`%${filters.category}%`);
      }

      if (filters.author_id) {
        whereClause += " AND author_id = ?";
        params.push(filters.author_id);
      }

      if (filters.search) {
        whereClause += " AND (title LIKE ? OR content LIKE ?)";
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      if (filters.tags && filters.tags.length > 0) {
        const tagConditions = filters.tags.map(() => "JSON_CONTAINS(tags, ?)").join(" AND ");
        whereClause += ` AND ${tagConditions}`;
        filters.tags.forEach(tag => params.push(`"${tag}"`));
      }

      const sql = `SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`;
      const result = await MySql.query<{ count: number }[]>(sql, params);
      
      if (result.status && result.data && result.data.length > 0) {
        return { status: true, data: result.data[0] };
      }
      
      return { status: false, message: "Failed to get count" };
    } catch (error) {
      logger.error(`Error in BlogRepository.getBlogsCount: ${generateError(error)}`);
      return { status: false, message: "Failed to get blogs count" };
    }
  };

  const getBlogById = async (id: number): Promise<SingleBlogDBResponse> => {
    try {
      const sql = `SELECT * FROM ${tableName} WHERE id = ?`;
      const result = await MySql.query<Blog[]>(sql, [id]);
      
      if (result.status && result.data && result.data.length > 0) {
        return { status: true, data: result.data[0] };
      }
      
      return { status: false, message: "Blog not found" };
    } catch (error) {
      logger.error(`Error in BlogRepository.getBlogById: ${generateError(error)}`);
      return { status: false, message: "Failed to fetch blog" };
    }
  };

  const getBlogBySlug = async (slug: string): Promise<SingleBlogDBResponse> => {
    try {
      const sql = `SELECT * FROM ${tableName} WHERE slug = ?`;
      const result = await MySql.query<Blog[]>(sql, [slug]);
      
      if (result.status && result.data && result.data.length > 0) {
        return { status: true, data: result.data[0] };
      }
      
      return { status: false, message: "Blog not found" };
    } catch (error) {
      logger.error(`Error in BlogRepository.getBlogBySlug: ${generateError(error)}`);
      return { status: false, message: "Failed to fetch blog" };
    }
  };

  const createBlog = async (blogData: CreateBlogRequest, authorId: number): Promise<SingleBlogDBResponse> => {
    try {
      // Generate slug from title if not provided
      const slug = blogData.title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      const sql = `
        INSERT INTO ${tableName} 
        (title, slug, content, excerpt, featured_image, author_id, category, tags, 
         meta_title, meta_description, status, published_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        blogData.title,
        slug,
        blogData.content,
        blogData.excerpt || null,
        blogData.featured_image || null,
        authorId,
        blogData.category || null,
        blogData.tags ? JSON.stringify(blogData.tags) : null,
        blogData.meta_title || null,
        blogData.meta_description || null,
        blogData.status || constants.STATUS.BLOG.DRAFT,
        blogData.published_at || null
      ];

      const result = await MySql.query(sql, params);
      
      if (result.status && result.data && typeof result.data === 'object' && 'insertId' in result.data) {
        return await getBlogById(result.data.insertId);
      }
      
      return { status: false, message: "Failed to create blog" };
    } catch (error) {
      logger.error(`Error in BlogRepository.createBlog: ${generateError(error)}`);
      return { status: false, message: "Failed to create blog" };
    }
  };

  const updateBlog = async (blogData: UpdateBlogRequest): Promise<SingleBlogDBResponse> => {
    try {
      const fields: string[] = [];
      const params: any[] = [];

      if (blogData.title !== undefined) {
        fields.push("title = ?");
        params.push(blogData.title);
        // Update slug when title is updated
        const slug = blogData.title.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        fields.push("slug = ?");
        params.push(slug);
      }
      if (blogData.content !== undefined) {
        fields.push("content = ?");
        params.push(blogData.content);
      }
      if (blogData.excerpt !== undefined) {
        fields.push("excerpt = ?");
        params.push(blogData.excerpt);
      }
      if (blogData.featured_image !== undefined) {
        fields.push("featured_image = ?");
        params.push(blogData.featured_image);
      }
      if (blogData.category !== undefined) {
        fields.push("category = ?");
        params.push(blogData.category);
      }
      if (blogData.tags !== undefined) {
        fields.push("tags = ?");
        params.push(blogData.tags ? JSON.stringify(blogData.tags) : null);
      }
      if (blogData.meta_title !== undefined) {
        fields.push("meta_title = ?");
        params.push(blogData.meta_title);
      }
      if (blogData.meta_description !== undefined) {
        fields.push("meta_description = ?");
        params.push(blogData.meta_description);
      }
      if (blogData.status !== undefined) {
        fields.push("status = ?");
        params.push(blogData.status);
      }
      if (blogData.published_at !== undefined) {
        fields.push("published_at = ?");
        params.push(blogData.published_at);
      }

      if (fields.length === 0) {
        return { status: false, message: "No fields to update" };
      }

      fields.push("updated_at = CURRENT_TIMESTAMP");
      params.push(blogData.id);

      const sql = `UPDATE ${tableName} SET ${fields.join(", ")} WHERE id = ?`;
      const result = await MySql.query(sql, params);
      
      if (result.status) {
        return await getBlogById(blogData.id);
      }
      
      return { status: false, message: "Failed to update blog" };
    } catch (error) {
      logger.error(`Error in BlogRepository.updateBlog: ${generateError(error)}`);
      return { status: false, message: "Failed to update blog" };
    }
  };

  const deleteBlog = async (id: number): Promise<{ status: boolean; message?: string }> => {
    try {
      const sql = `DELETE FROM ${tableName} WHERE id = ?`;
      const result = await MySql.query(sql, [id]);
      
      if (result.status) {
        return { status: true };
      }
      
      return { status: false, message: "Failed to delete blog" };
    } catch (error) {
      logger.error(`Error in BlogRepository.deleteBlog: ${generateError(error)}`);
      return { status: false, message: "Failed to delete blog" };
    }
  };

  return {
    getBlogs,
    getBlogsCount,
    getBlogById,
    getBlogBySlug,
    createBlog,
    updateBlog,
    deleteBlog,
  };
};

export default BlogRepository; 