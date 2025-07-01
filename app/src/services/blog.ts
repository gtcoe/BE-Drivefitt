import { logger } from "../logging";
import { generateError } from "../services/util";
import constants from "../config/constants/drivefitt-constants";
import cacheService from "../services/cacheService";
import Response from "../models/response";
import BlogRepositoryFactory from "../repositories/blog";
import { 
  Blog, 
  CreateBlogRequest, 
  UpdateBlogRequest, 
  BlogSearchFilters, 
  BlogListResponse 
} from "../models/Blog/blog";

const BlogService = () => {
  const blogRepository = BlogRepositoryFactory();
  const moduleKey = "BLOGS_LIST";

  const getBlogs = async (
    page: number = constants.PAGINATION.DEFAULT_PAGE,
    limit: number = constants.PAGINATION.DEFAULT_LIMIT,
    filters: BlogSearchFilters = {}
  ): Promise<Response> => {
    const response = new Response(false);

    try {
      if (page < 1) page = constants.PAGINATION.DEFAULT_PAGE;
      if (limit < 1 || limit > constants.PAGINATION.MAX_LIMIT) {
        limit = constants.PAGINATION.DEFAULT_LIMIT;
      }

      const cacheParams = { page, limit, filters };

      const cachedData = cacheService.getListCache<BlogListResponse>(moduleKey, cacheParams);
      if (cachedData) {
        response.setStatus(true);
        response.setData("blogs", cachedData.blogs);
        response.setData("pagination", {
          total: cachedData.total,
          page: cachedData.page,
          limit: cachedData.limit,
          totalPages: cachedData.totalPages,
        });
        response.setMessage(constants.SUCCESS_MESSAGES.FETCHED);
        return response;
      }

      const [blogsResult, countResult] = await Promise.all([
        blogRepository.getBlogs(page, limit, filters),
        blogRepository.getBlogsCount(filters)
      ]);

      if (!blogsResult.status) {
        response.setStatusCode(500);
        response.setMessage(blogsResult.message || constants.ERROR_MESSAGES.SERVER_ERROR);
        return response;
      }

      if (!countResult.status) {
        response.setStatusCode(500);
        response.setMessage(countResult.message || constants.ERROR_MESSAGES.SERVER_ERROR);
        return response;
      }

      const blogs = blogsResult.data || [];
      const total = countResult.data?.count || 0;
      const totalPages = Math.ceil(total / limit);

      const responseData: BlogListResponse = {
        blogs,
        total,
        page,
        limit,
        totalPages,
      };

      cacheService.setListCache(moduleKey, cacheParams, responseData, constants.CACHE_TTL.MEDIUM);

      response.setStatus(true);
      response.setData("blogs", blogs);
      response.setData("pagination", {
        total,
        page,
        limit,
        totalPages,
      });
      response.setMessage(constants.SUCCESS_MESSAGES.FETCHED);
      return response;

    } catch (error) {
      logger.error(`Error in BlogService.getBlogs: ${generateError(error)}`);
      response.setStatusCode(500);
      response.setMessage(constants.ERROR_MESSAGES.SERVER_ERROR);
      return response;
    }
  };

  const getBlogById = async (id: number): Promise<Response> => {
    const response = new Response(false);

    try {
      const cachedBlog = cacheService.getItemCache<Blog>(moduleKey, id);
      if (cachedBlog) {
        response.setStatus(true);
        response.setData("blog", cachedBlog);
        response.setMessage(constants.SUCCESS_MESSAGES.FETCHED);
        return response;
      }

      const result = await blogRepository.getBlogById(id);

      if (!result.status) {
        response.setStatusCode(404);
        response.setMessage(result.message || constants.ERROR_MESSAGES.RESOURCE_NOT_FOUND);
        return response;
      }

      if (result.data) {
        cacheService.setItemCache(moduleKey, id, result.data, constants.CACHE_TTL.MEDIUM);
      }

      response.setStatus(true);
      response.setData("blog", result.data);
      response.setMessage(constants.SUCCESS_MESSAGES.FETCHED);
      return response;

    } catch (error) {
      logger.error(`Error in BlogService.getBlogById: ${generateError(error)}`);
      response.setStatusCode(500);
      response.setMessage(constants.ERROR_MESSAGES.SERVER_ERROR);
      return response;
    }
  };

  const getBlogBySlug = async (slug: string): Promise<Response> => {
    const response = new Response(false);

    try {
      const result = await blogRepository.getBlogBySlug(slug);

      if (!result.status) {
        response.setStatusCode(404);
        response.setMessage(result.message || constants.ERROR_MESSAGES.RESOURCE_NOT_FOUND);
        return response;
      }

      response.setStatus(true);
      response.setData("blog", result.data);
      response.setMessage(constants.SUCCESS_MESSAGES.FETCHED);
      return response;

    } catch (error) {
      logger.error(`Error in BlogService.getBlogBySlug: ${generateError(error)}`);
      response.setStatusCode(500);
      response.setMessage(constants.ERROR_MESSAGES.SERVER_ERROR);
      return response;
    }
  };

  const createBlog = async (blogData: CreateBlogRequest, authorId: number): Promise<Response> => {
    const response = new Response(false);

    try {
      if (!blogData.title || !blogData.content) {
        response.setStatusCode(400);
        response.setMessage(constants.ERROR_MESSAGES.VALIDATION_ERROR);
        return response;
      }

      const result = await blogRepository.createBlog(blogData, authorId);

      if (!result.status) {
        response.setStatusCode(500);
        response.setMessage(result.message || constants.ERROR_MESSAGES.SERVER_ERROR);
        return response;
      }

      cacheService.invalidateModuleCache(moduleKey);

      response.setStatus(true);
      response.setData("blog", result.data);
      response.setMessage(constants.SUCCESS_MESSAGES.CREATED);
      return response;

    } catch (error) {
      logger.error(`Error in BlogService.createBlog: ${generateError(error)}`);
      response.setStatusCode(500);
      response.setMessage(constants.ERROR_MESSAGES.SERVER_ERROR);
      return response;
    }
  };

  const updateBlog = async (blogData: UpdateBlogRequest): Promise<Response> => {
    const response = new Response(false);

    try {
      const existingResult = await blogRepository.getBlogById(blogData.id);
      if (!existingResult.status) {
        response.setStatusCode(404);
        response.setMessage(constants.ERROR_MESSAGES.RESOURCE_NOT_FOUND);
        return response;
      }

      const result = await blogRepository.updateBlog(blogData);

      if (!result.status) {
        response.setStatusCode(500);
        response.setMessage(result.message || constants.ERROR_MESSAGES.SERVER_ERROR);
        return response;
      }

      cacheService.invalidateModuleCache(moduleKey);
      cacheService.deleteItemCache(moduleKey, blogData.id);

      response.setStatus(true);
      response.setData("blog", result.data);
      response.setMessage(constants.SUCCESS_MESSAGES.UPDATED);
      return response;

    } catch (error) {
      logger.error(`Error in BlogService.updateBlog: ${generateError(error)}`);
      response.setStatusCode(500);
      response.setMessage(constants.ERROR_MESSAGES.SERVER_ERROR);
      return response;
    }
  };

  const deleteBlog = async (id: number): Promise<Response> => {
    const response = new Response(false);

    try {
      const existingResult = await blogRepository.getBlogById(id);
      if (!existingResult.status) {
        response.setStatusCode(404);
        response.setMessage(constants.ERROR_MESSAGES.RESOURCE_NOT_FOUND);
        return response;
      }

      const result = await blogRepository.deleteBlog(id);

      if (!result.status) {
        response.setStatusCode(500);
        response.setMessage(result.message || constants.ERROR_MESSAGES.SERVER_ERROR);
        return response;
      }

      cacheService.invalidateModuleCache(moduleKey);
      cacheService.deleteItemCache(moduleKey, id);

      response.setStatus(true);
      response.setMessage(constants.SUCCESS_MESSAGES.DELETED);
      return response;

    } catch (error) {
      logger.error(`Error in BlogService.deleteBlog: ${generateError(error)}`);
      response.setStatusCode(500);
      response.setMessage(constants.ERROR_MESSAGES.SERVER_ERROR);
      return response;
    }
  };

  return {
    getBlogs,
    getBlogById,
    getBlogBySlug,
    createBlog,
    updateBlog,
    deleteBlog,
  };
};

export default BlogService; 