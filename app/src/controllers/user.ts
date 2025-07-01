import { Request, Response } from "express";
import { logger } from "../logging";
import { generateError } from "../services/util";
import userService from "../services/user";
import constants from "../config/constants/drivefitt-constants";
import { 
  UserRegistrationRequest, 
  UserLoginRequest,
  UserProfileUpdateRequest,
  CreateUserDetailsRequest,
  CreateSubscriptionRequest,
  UserSearchFilters,
  SubscriptionSearchFilters
} from "../models/User/user";

// Public endpoints for Brand Website
export const registerUser = async (req: Request, res: Response) => {
  try {
    const userData: UserRegistrationRequest = req.body;

    // Basic validation
    if (!userData.email || !userData.password || !userData.first_name || !userData.last_name) {
      return res.status(400).json({
        status: false,
        message: "Email, password, first name and last name are required",
      });
    }

    const result = await userService.registerUser(userData);
    
    const statusCode = result.status ? 201 : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    logger.error(`Error in registerUser: ${generateError(error)}`);
    return res.status(500).json({
      status: false,
      message: constants.ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const loginData: UserLoginRequest = req.body;

    // Basic validation
    if (!loginData.email || !loginData.password) {
      return res.status(400).json({
        status: false,
        message: "Email and password are required",
      });
    }

    const result = await userService.loginUser(loginData);
    
    const statusCode = result.status ? 200 : 401;
    return res.status(statusCode).json(result);
  } catch (error) {
    logger.error(`Error in loginUser: ${generateError(error)}`);
    return res.status(500).json({
      status: false,
      message: constants.ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        status: false,
        message: constants.ERROR_MESSAGES.ACCESS_DENIED,
      });
    }

    const result = await userService.getUserProfile(userId);
    
    const statusCode = result.status ? 200 : 404;
    return res.status(statusCode).json(result);
  } catch (error) {
    logger.error(`Error in getUserProfile: ${generateError(error)}`);
    return res.status(500).json({
      status: false,
      message: constants.ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const updateData: Omit<UserProfileUpdateRequest, 'id'> = req.body;
    
    if (!userId) {
      return res.status(401).json({
        status: false,
        message: constants.ERROR_MESSAGES.ACCESS_DENIED,
      });
    }

    const result = await userService.updateUserProfile(userId, updateData);
    
    const statusCode = result.status ? 200 : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    logger.error(`Error in updateUserProfile: ${generateError(error)}`);
    return res.status(500).json({
      status: false,
      message: constants.ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

export const createUserDetails = async (req: Request, res: Response) => {
  try {
    const userDetailsData: CreateUserDetailsRequest = req.body;

    // Basic validation
    if (!userDetailsData.name || !userDetailsData.phone || !userDetailsData.email) {
      return res.status(400).json({
        status: false,
        message: "Name, phone and email are required",
      });
    }

    const result = await userService.createUserDetails(userDetailsData);
    
    const statusCode = result.status ? 201 : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    logger.error(`Error in createUserDetails: ${generateError(error)}`);
    return res.status(500).json({
      status: false,
      message: constants.ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const subscriptionData: CreateSubscriptionRequest = req.body;

    // Basic validation
    if (!subscriptionData.subscription_id || !subscriptionData.user_id || !subscriptionData.plan_id || !subscriptionData.base_amount) {
      return res.status(400).json({
        status: false,
        message: "Subscription ID, user ID, plan ID and base amount are required",
      });
    }

    const result = await userService.createSubscription(subscriptionData);
    
    const statusCode = result.status ? 201 : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    logger.error(`Error in createSubscription: ${generateError(error)}`);
    return res.status(500).json({
      status: false,
      message: constants.ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

// Admin endpoints
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || constants.PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit as string) || constants.PAGINATION.DEFAULT_LIMIT, constants.PAGINATION.MAX_LIMIT);
    
    const filters: UserSearchFilters = {
      email: req.query.email as string,
      phone: req.query.phone as string,
      status: req.query.status ? parseInt(req.query.status as string) : undefined,
      email_verified: req.query.email_verified ? parseInt(req.query.email_verified as string) : undefined,
      search: req.query.search as string,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => filters[key as keyof UserSearchFilters] === undefined && delete filters[key as keyof UserSearchFilters]);

    const result = await userService.getAllUsers(page, limit, filters);
    
    const statusCode = result.status ? 200 : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    logger.error(`Error in getAllUsers: ${generateError(error)}`);
    return res.status(500).json({
      status: false,
      message: constants.ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

export const getAllSubscriptions = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || constants.PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit as string) || constants.PAGINATION.DEFAULT_LIMIT, constants.PAGINATION.MAX_LIMIT);
    
    const filters: SubscriptionSearchFilters = {
      user_id: req.query.user_id as string,
      cms_user_id: req.query.cms_user_id ? parseInt(req.query.cms_user_id as string) : undefined,
      plan_id: req.query.plan_id as string,
      status: req.query.status as string,
      payment_status: req.query.payment_status as string,
      search: req.query.search as string,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => filters[key as keyof SubscriptionSearchFilters] === undefined && delete filters[key as keyof SubscriptionSearchFilters]);

    const result = await userService.getAllSubscriptions(page, limit, filters);
    
    const statusCode = result.status ? 200 : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    logger.error(`Error in getAllSubscriptions: ${generateError(error)}`);
    return res.status(500).json({
      status: false,
      message: constants.ERROR_MESSAGES.SERVER_ERROR,
    });
  }
}; 