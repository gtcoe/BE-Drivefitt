import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { logger } from "../logging";
import { generateError } from "./util";
import UserRepository from "../repositories/user";
import { userLoginRepository } from "../repositories/userLogin";
import constants from "../config/constants/drivefitt-constants";
import { 
  UserRegistrationRequest, 
  UserLoginRequest, 
  UserLoginResponse,
  UserProfileUpdateRequest,
  CreateUserDetailsRequest,
  CreateSubscriptionRequest,
  UserSearchFilters,
  SubscriptionSearchFilters,
  UserListResponse,
  SubscriptionListResponse,
  User
} from "../models/User/user";
import { ApiResponse } from "../models/response";

const userRepository = UserRepository();

export const userService = {
  // User Registration
  registerUser: async (userData: UserRegistrationRequest): Promise<ApiResponse<UserLoginResponse>> => {
    try {
      // Check if user already exists
      const existingUser = await userRepository.getUserByEmail(userData.email);
      if (existingUser.status && existingUser.data) {
        return {
          status: false,
          message: constants.ERROR_MESSAGES.EMAIL_ALREADY_EXISTS,
        };
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      
      // Create user
      const userDataWithHashedPassword = {
        ...userData,
        password: hashedPassword,
      };

      const newUser = await userRepository.createUser(userDataWithHashedPassword);
      if (!newUser.status || !newUser.data) {
        return {
          status: false,
          message: newUser.message || "Failed to create user",
        };
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: newUser.data.id, 
          email: newUser.data.email,
          type: 'user'
        },
        process.env.JWT_SECRET || "default_secret",
        { expiresIn: "24h" }
      );

      // Remove password from response
      const { password, ...userWithoutPassword } = newUser.data;

      // Track login
      await userLoginRepository.trackUserLogin({
        user_id: newUser.data.id,
        email: newUser.data.email,
        login_type: "web",
        login_status: "success",
        ip_address: null,
        user_agent: null,
      });

      return {
        status: true,
        message: constants.SUCCESS_MESSAGES.USER_REGISTERED,
        data: {
          token,
          user: userWithoutPassword,
        },
      };
    } catch (error) {
      logger.error(`Error in userService.registerUser: ${generateError(error)}`);
      return {
        status: false,
        message: constants.ERROR_MESSAGES.SERVER_ERROR,
      };
    }
  },

  // User Login
  loginUser: async (loginData: UserLoginRequest): Promise<ApiResponse<UserLoginResponse>> => {
    try {
      // Get user by email
      const userResult = await userRepository.getUserByEmail(loginData.email);
      if (!userResult.status || !userResult.data) {
        // Track failed login
        await userLoginRepository.trackUserLogin({
          user_id: null,
          email: loginData.email,
          login_type: "web",
          login_status: "failed",
          failure_reason: "Email not found",
          ip_address: null,
          user_agent: null,
        });

        return {
          status: false,
          message: constants.ERROR_MESSAGES.INVALID_CREDENTIALS,
        };
      }

      const user = userResult.data;

      // Check if user is active
      if (user.status !== constants.STATUS.USER.ACTIVE) {
        // Track failed login
        await userLoginRepository.trackUserLogin({
          user_id: user.id,
          email: user.email,
          login_type: "web",
          login_status: "blocked",
          failure_reason: "Account inactive",
          ip_address: null,
          user_agent: null,
        });

        return {
          status: false,
          message: constants.SIGN_IN_STATUS_MESSAGE.INACTIVE_BY_ADMIN,
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
      if (!isPasswordValid) {
        // Track failed login
        await userLoginRepository.trackUserLogin({
          user_id: user.id,
          email: user.email,
          login_type: "web",
          login_status: "failed",
          failure_reason: "Incorrect password",
          ip_address: null,
          user_agent: null,
        });

        return {
          status: false,
          message: constants.ERROR_MESSAGES.INVALID_CREDENTIALS,
        };
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          type: 'user'
        },
        process.env.JWT_SECRET || "default_secret",
        { expiresIn: "24h" }
      );

      // Update last login
      await userRepository.updateLastLogin(user.id);

      // Track successful login
      await userLoginRepository.trackUserLogin({
        user_id: user.id,
        email: user.email,
        login_type: "web",
        login_status: "success",
        ip_address: null,
        user_agent: null,
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      return {
        status: true,
        message: constants.SUCCESS_MESSAGES.LOGIN_SUCCESSFUL,
        data: {
          token,
          user: userWithoutPassword,
        },
      };
    } catch (error) {
      logger.error(`Error in userService.loginUser: ${generateError(error)}`);
      return {
        status: false,
        message: constants.ERROR_MESSAGES.SERVER_ERROR,
      };
    }
  },

  // Get User Profile
  getUserProfile: async (userId: number): Promise<ApiResponse<Omit<User, 'password'>>> => {
    try {
      const userResult = await userRepository.getUserById(userId);
      if (!userResult.status || !userResult.data) {
        return {
          status: false,
          message: constants.ERROR_MESSAGES.USER_NOT_FOUND,
        };
      }

      const { password, ...userWithoutPassword } = userResult.data;

      return {
        status: true,
        message: constants.SUCCESS_MESSAGES.FETCHED,
        data: userWithoutPassword,
      };
    } catch (error) {
      logger.error(`Error in userService.getUserProfile: ${generateError(error)}`);
      return {
        status: false,
        message: constants.ERROR_MESSAGES.SERVER_ERROR,
      };
    }
  },

  // Update User Profile
  updateUserProfile: async (userId: number, updateData: Omit<UserProfileUpdateRequest, 'id'>): Promise<ApiResponse<Omit<User, 'password'>>> => {
    try {
      const userData: UserProfileUpdateRequest = {
        ...updateData,
        id: userId,
      };

      const updatedUser = await userRepository.updateUser(userData);
      if (!updatedUser.status || !updatedUser.data) {
        return {
          status: false,
          message: updatedUser.message || "Failed to update profile",
        };
      }

      const { password, ...userWithoutPassword } = updatedUser.data;

      return {
        status: true,
        message: constants.SUCCESS_MESSAGES.PROFILE_UPDATED,
        data: userWithoutPassword,
      };
    } catch (error) {
      logger.error(`Error in userService.updateUserProfile: ${generateError(error)}`);
      return {
        status: false,
        message: constants.ERROR_MESSAGES.SERVER_ERROR,
      };
    }
  },

  // Admin: Get All Users
  getAllUsers: async (
    page: number = 1,
    limit: number = 10,
    filters: UserSearchFilters = {}
  ): Promise<ApiResponse<UserListResponse>> => {
    try {
      const [usersResult, countResult] = await Promise.all([
        userRepository.getUsers(page, limit, filters),
        userRepository.getUsersCount(filters),
      ]);

      if (!usersResult.status || !countResult.status || !countResult.data) {
        return {
          status: false,
          message: "Failed to fetch users",
        };
      }

      const users = usersResult.data || [];
      const totalCount = countResult.data.count;
      const totalPages = Math.ceil(totalCount / limit);

      // Remove passwords from all users
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      return {
        status: true,
        message: constants.SUCCESS_MESSAGES.FETCHED,
        data: {
          users: usersWithoutPasswords,
          total: totalCount,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      logger.error(`Error in userService.getAllUsers: ${generateError(error)}`);
      return {
        status: false,
        message: constants.ERROR_MESSAGES.SERVER_ERROR,
      };
    }
  },

  // Create User Details
  createUserDetails: async (userDetailsData: CreateUserDetailsRequest): Promise<ApiResponse<any>> => {
    try {
      const result = await userRepository.createUserDetails(userDetailsData);
      if (!result.status || !result.data) {
        return {
          status: false,
          message: result.message || "Failed to create user details",
        };
      }

      return {
        status: true,
        message: constants.SUCCESS_MESSAGES.CREATED,
        data: result.data,
      };
    } catch (error) {
      logger.error(`Error in userService.createUserDetails: ${generateError(error)}`);
      return {
        status: false,
        message: constants.ERROR_MESSAGES.SERVER_ERROR,
      };
    }
  },

  // Create Subscription
  createSubscription: async (subscriptionData: CreateSubscriptionRequest): Promise<ApiResponse<any>> => {
    try {
      const result = await userRepository.createSubscription(subscriptionData);
      if (!result.status || !result.data) {
        return {
          status: false,
          message: result.message || "Failed to create subscription",
        };
      }

      return {
        status: true,
        message: constants.SUCCESS_MESSAGES.SUBSCRIPTION_CREATED,
        data: result.data,
      };
    } catch (error) {
      logger.error(`Error in userService.createSubscription: ${generateError(error)}`);
      return {
        status: false,
        message: constants.ERROR_MESSAGES.SERVER_ERROR,
      };
    }
  },

  // Get Subscriptions (Admin)
  getAllSubscriptions: async (
    page: number = 1,
    limit: number = 10,
    filters: SubscriptionSearchFilters = {}
  ): Promise<ApiResponse<SubscriptionListResponse>> => {
    try {
      const [subscriptionsResult, countResult] = await Promise.all([
        userRepository.getSubscriptions(page, limit, filters),
        userRepository.getSubscriptionsCount(filters),
      ]);

      if (!subscriptionsResult.status || !countResult.status || !countResult.data) {
        return {
          status: false,
          message: "Failed to fetch subscriptions",
        };
      }

      const subscriptions = subscriptionsResult.data || [];
      const totalCount = countResult.data.count;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        status: true,
        message: constants.SUCCESS_MESSAGES.FETCHED,
        data: {
          subscriptions,
          total: totalCount,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      logger.error(`Error in userService.getAllSubscriptions: ${generateError(error)}`);
      return {
        status: false,
        message: constants.ERROR_MESSAGES.SERVER_ERROR,
      };
    }
  },
};

export default userService; 