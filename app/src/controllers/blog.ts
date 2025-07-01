import { Request, Response } from "express";
import { logger } from "../logging";
import BlogService from "../services/blog";
import { generateError } from "../services/util";
import ResponseModel from "../models/response";
import { CreateBlogRequest, UpdateBlogRequest, BlogSearchFilters } from "../models/Blog/blog";

const blogService = BlogService();

const BlogController = () => {
  const getBlogs = async (req: Request, res: Response): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const filters: BlogSearchFilters = {
        status: req.query.status ? parseInt(req.query.status as string) : undefined,
        category: req.query.category as string,
        author_id: req.query.author_id ? parseInt(req.query.author_id as string) : undefined,
        search: req.query.search as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      };

      Object.keys(filters).forEach(key => 
        filters[key as keyof BlogSearchFilters] === undefined && 
        delete filters[key as keyof BlogSearchFilters]
      );

      const result = await blogService.getBlogs(page, limit, filters);
      res.status(result.statusCode).send(result);
    } catch (e) {
      logger.error(`Error in BlogController.getBlogs: ${generateError(e)}`);
      response.setStatusCode(500);
      response.setMessage("Internal Server Error");
      res.status(500).send(response);
    }
  };

  const getBlogById = async (req: Request, res: Response): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const id = parseInt(req.params.id);
      
      if (!id || isNaN(id)) {
        response.setStatusCode(400);
        response.setMessage("Invalid blog ID");
        res.status(400).send(response);
        return;
      }

      const result = await blogService.getBlogById(id);
      res.status(result.statusCode).send(result);
    } catch (e) {
      logger.error(`Error in BlogController.getBlogById: ${generateError(e)}`);
      response.setStatusCode(500);
      response.setMessage("Internal Server Error");
      res.status(500).send(response);
    }
  };

  const getBlogBySlug = async (req: Request, res: Response): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const slug = req.params.slug;
      
      if (!slug) {
        response.setStatusCode(400);
        response.setMessage("Blog slug is required");
        res.status(400).send(response);
        return;
      }

      const result = await blogService.getBlogBySlug(slug);
      res.status(result.statusCode).send(result);
    } catch (e) {
      logger.error(`Error in BlogController.getBlogBySlug: ${generateError(e)}`);
      response.setStatusCode(500);
      response.setMessage("Internal Server Error");
      res.status(500).send(response);
    }
  };

  const createBlog = async (req: Request, res: Response): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const blogData: CreateBlogRequest = {
        title: req.body.title,
        content: req.body.content,
        excerpt: req.body.excerpt,
        featured_image: req.body.featured_image,
        category: req.body.category,
        tags: req.body.tags,
        meta_title: req.body.meta_title,
        meta_description: req.body.meta_description,
        status: req.body.status,
        published_at: req.body.published_at,
      };

      if (!blogData.title || !blogData.content) {
        response.setStatusCode(400);
        response.setMessage("Title and content are required");
        res.status(400).send(response);
        return;
      }

      const authorId = req.body.token_user_id;
      const result = await blogService.createBlog(blogData, authorId);
      res.status(result.statusCode).send(result);
    } catch (e) {
      logger.error(`Error in BlogController.createBlog: ${generateError(e)}`);
      response.setStatusCode(500);
      response.setMessage("Internal Server Error");
      res.status(500).send(response);
    }
  };

  const updateBlog = async (req: Request, res: Response): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const id = parseInt(req.params.id);
      
      if (!id || isNaN(id)) {
        response.setStatusCode(400);
        response.setMessage("Invalid blog ID");
        res.status(400).send(response);
        return;
      }

      const blogData: UpdateBlogRequest = {
        id,
        title: req.body.title,
        content: req.body.content,
        excerpt: req.body.excerpt,
        featured_image: req.body.featured_image,
        category: req.body.category,
        tags: req.body.tags,
        meta_title: req.body.meta_title,
        meta_description: req.body.meta_description,
        status: req.body.status,
        published_at: req.body.published_at,
      };

      Object.keys(blogData).forEach(key => 
        blogData[key as keyof UpdateBlogRequest] === undefined && 
        delete blogData[key as keyof UpdateBlogRequest]
      );

      const result = await blogService.updateBlog(blogData);
      res.status(result.statusCode).send(result);
    } catch (e) {
      logger.error(`Error in BlogController.updateBlog: ${generateError(e)}`);
      response.setStatusCode(500);
      response.setMessage("Internal Server Error");
      res.status(500).send(response);
    }
  };

  const deleteBlog = async (req: Request, res: Response): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const id = parseInt(req.params.id);
      
      if (!id || isNaN(id)) {
        response.setStatusCode(400);
        response.setMessage("Invalid blog ID");
        res.status(400).send(response);
        return;
      }

      const result = await blogService.deleteBlog(id);
      res.status(result.statusCode).send(result);
    } catch (e) {
      logger.error(`Error in BlogController.deleteBlog: ${generateError(e)}`);
      response.setStatusCode(500);
      response.setMessage("Internal Server Error");
      res.status(500).send(response);
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

const blogController = BlogController();

// Export individual functions for use in routes
export const getBlogs = blogController.getBlogs;
export const getBlogById = blogController.getBlogById;
export const getBlogBySlug = blogController.getBlogBySlug;
export const createBlog = blogController.createBlog;
export const updateBlog = blogController.updateBlog;
export const deleteBlog = blogController.deleteBlog;

export default blogController; 