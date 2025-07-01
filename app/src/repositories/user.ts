import MySql from "../database/mySql";
import { logger } from "../logging";
import { generateError } from "../services/util";
import constants from "../config/constants/drivefitt-constants";
import { 
  User, 
  UserDetails, 
  Subscription,
  UserRegistrationRequest, 
  UserProfileUpdateRequest,
  CreateUserDetailsRequest,
  CreateSubscriptionRequest,
  UserSearchFilters,
  SubscriptionSearchFilters
} from "../models/User/user";

export interface UserDBResponse {
  status: boolean;
  data?: User[] | null;
  message?: string;
}

export interface SingleUserDBResponse {
  status: boolean;
  data?: User | null;
  message?: string;
}

export interface UserDetailsDBResponse {
  status: boolean;
  data?: UserDetails[] | null;
  message?: string;
}

export interface SingleUserDetailsDBResponse {
  status: boolean;
  data?: UserDetails | null;
  message?: string;
}

export interface SubscriptionDBResponse {
  status: boolean;
  data?: Subscription[] | null;
  message?: string;
}

export interface SingleSubscriptionDBResponse {
  status: boolean;
  data?: Subscription | null;
  message?: string;
}

export interface CountDBResponse {
  status: boolean;
  data?: { count: number } | null;
  message?: string;
}

const UserRepository = () => {
  const usersTable = constants.TABLES.USERS;
  const userDetailsTable = constants.TABLES.USER_DETAILS;
  const subscriptionTable = constants.TABLES.SUBSCRIPTION;

  // Users CRUD operations
  const getUserByEmail = async (email: string): Promise<SingleUserDBResponse> => {
    try {
      const sql = `SELECT * FROM ${usersTable} WHERE email = ?`;
      const result = await MySql.query<User[]>(sql, [email]);
      
      if (result.status && result.data && result.data.length > 0) {
        return { status: true, data: result.data[0] };
      }
      
      return { status: false, message: "User not found" };
    } catch (error) {
      logger.error(`Error in UserRepository.getUserByEmail: ${generateError(error)}`);
      return { status: false, message: "Failed to fetch user" };
    }
  };

  const getUserById = async (id: number): Promise<SingleUserDBResponse> => {
    try {
      const sql = `SELECT * FROM ${usersTable} WHERE id = ?`;
      const result = await MySql.query<User[]>(sql, [id]);
      
      if (result.status && result.data && result.data.length > 0) {
        return { status: true, data: result.data[0] };
      }
      
      return { status: false, message: "User not found" };
    } catch (error) {
      logger.error(`Error in UserRepository.getUserById: ${generateError(error)}`);
      return { status: false, message: "Failed to fetch user" };
    }
  };

  const createUser = async (userData: UserRegistrationRequest): Promise<SingleUserDBResponse> => {
    try {
      const sql = `
        INSERT INTO ${usersTable} (email, phone, password, first_name, last_name, date_of_birth, gender) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        userData.email,
        userData.phone || null,
        userData.password,
        userData.first_name,
        userData.last_name,
        userData.date_of_birth || null,
        userData.gender || null
      ];

      const result = await MySql.query(sql, params);
      
      if (result.status && result.data && typeof result.data === 'object' && 'insertId' in result.data) {
        return await getUserById(result.data.insertId);
      }
      
      return { status: false, message: "Failed to create user" };
    } catch (error) {
      logger.error(`Error in UserRepository.createUser: ${generateError(error)}`);
      return { status: false, message: "Failed to create user" };
    }
  };

  const updateUser = async (userData: UserProfileUpdateRequest): Promise<SingleUserDBResponse> => {
    try {
      const fields: string[] = [];
      const params: any[] = [];

      if (userData.email !== undefined) {
        fields.push("email = ?");
        params.push(userData.email);
      }
      if (userData.phone !== undefined) {
        fields.push("phone = ?");
        params.push(userData.phone);
      }
      if (userData.first_name !== undefined) {
        fields.push("first_name = ?");
        params.push(userData.first_name);
      }
      if (userData.last_name !== undefined) {
        fields.push("last_name = ?");
        params.push(userData.last_name);
      }
      if (userData.date_of_birth !== undefined) {
        fields.push("date_of_birth = ?");
        params.push(userData.date_of_birth);
      }
      if (userData.gender !== undefined) {
        fields.push("gender = ?");
        params.push(userData.gender);
      }

      if (fields.length === 0) {
        return { status: false, message: "No fields to update" };
      }

      fields.push("updated_at = CURRENT_TIMESTAMP");
      params.push(userData.id);

      const sql = `UPDATE ${usersTable} SET ${fields.join(", ")} WHERE id = ?`;
      const result = await MySql.query(sql, params);
      
      if (result.status) {
        return await getUserById(userData.id);
      }
      
      return { status: false, message: "Failed to update user" };
    } catch (error) {
      logger.error(`Error in UserRepository.updateUser: ${generateError(error)}`);
      return { status: false, message: "Failed to update user" };
    }
  };

  const updateLastLogin = async (id: number): Promise<{ status: boolean; message?: string }> => {
    try {
      const sql = `UPDATE ${usersTable} SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?`;
      const result = await MySql.query(sql, [id]);
      
      if (result.status) {
        return { status: true };
      }
      
      return { status: false, message: "Failed to update last login" };
    } catch (error) {
      logger.error(`Error in UserRepository.updateLastLogin: ${generateError(error)}`);
      return { status: false, message: "Failed to update last login" };
    }
  };

  const getUsers = async (
    page: number = 1,
    limit: number = 10,
    filters: UserSearchFilters = {}
  ): Promise<UserDBResponse> => {
    try {
      const offset = (page - 1) * limit;
      let whereClause = "WHERE 1=1";
      const params: any[] = [];

      if (filters.email) {
        whereClause += " AND email LIKE ?";
        params.push(`%${filters.email}%`);
      }

      if (filters.phone) {
        whereClause += " AND phone LIKE ?";
        params.push(`%${filters.phone}%`);
      }

      if (filters.status !== undefined) {
        whereClause += " AND status = ?";
        params.push(filters.status);
      }

      if (filters.email_verified !== undefined) {
        whereClause += " AND email_verified = ?";
        params.push(filters.email_verified);
      }

      if (filters.search) {
        whereClause += " AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (filters.start_date) {
        whereClause += " AND DATE(created_at) >= ?";
        params.push(filters.start_date);
      }

      if (filters.end_date) {
        whereClause += " AND DATE(created_at) <= ?";
        params.push(filters.end_date);
      }

      const sql = `
        SELECT * FROM ${usersTable} 
        ${whereClause} 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      params.push(limit, offset);
      
      const result = await MySql.query<User[]>(sql, params);
      return result;
    } catch (error) {
      logger.error(`Error in UserRepository.getUsers: ${generateError(error)}`);
      return { status: false, message: "Failed to fetch users" };
    }
  };

  const getUsersCount = async (filters: UserSearchFilters = {}): Promise<CountDBResponse> => {
    try {
      let whereClause = "WHERE 1=1";
      const params: any[] = [];

      if (filters.email) {
        whereClause += " AND email LIKE ?";
        params.push(`%${filters.email}%`);
      }

      if (filters.phone) {
        whereClause += " AND phone LIKE ?";
        params.push(`%${filters.phone}%`);
      }

      if (filters.status !== undefined) {
        whereClause += " AND status = ?";
        params.push(filters.status);
      }

      if (filters.email_verified !== undefined) {
        whereClause += " AND email_verified = ?";
        params.push(filters.email_verified);
      }

      if (filters.search) {
        whereClause += " AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (filters.start_date) {
        whereClause += " AND DATE(created_at) >= ?";
        params.push(filters.start_date);
      }

      if (filters.end_date) {
        whereClause += " AND DATE(created_at) <= ?";
        params.push(filters.end_date);
      }

      const sql = `SELECT COUNT(*) as count FROM ${usersTable} ${whereClause}`;
      const result = await MySql.query<{ count: number }[]>(sql, params);
      
      if (result.status && result.data && result.data.length > 0) {
        return { status: true, data: result.data[0] };
      }
      
      return { status: false, message: "Failed to get count" };
    } catch (error) {
      logger.error(`Error in UserRepository.getUsersCount: ${generateError(error)}`);
      return { status: false, message: "Failed to get users count" };
    }
  };

  // User Details CRUD operations
  const createUserDetails = async (userDetailsData: CreateUserDetailsRequest): Promise<SingleUserDetailsDBResponse> => {
    try {
      const sql = `
        INSERT INTO ${userDetailsTable} (name, phone, email, dob, gender, cms_user_id, source, otp_verified) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        userDetailsData.name,
        userDetailsData.phone,
        userDetailsData.email,
        userDetailsData.dob || null,
        userDetailsData.gender || null,
        userDetailsData.cms_user_id || null,
        userDetailsData.source || null,
        userDetailsData.otp_verified || false
      ];

      const result = await MySql.query(sql, params);
      
      if (result.status && result.data && typeof result.data === 'object' && 'insertId' in result.data) {
        return await getUserDetailsById(result.data.insertId);
      }
      
      return { status: false, message: "Failed to create user details" };
    } catch (error) {
      logger.error(`Error in UserRepository.createUserDetails: ${generateError(error)}`);
      return { status: false, message: "Failed to create user details" };
    }
  };

  const getUserDetailsById = async (id: number): Promise<SingleUserDetailsDBResponse> => {
    try {
      const sql = `SELECT * FROM ${userDetailsTable} WHERE id = ?`;
      const result = await MySql.query<UserDetails[]>(sql, [id]);
      
      if (result.status && result.data && result.data.length > 0) {
        return { status: true, data: result.data[0] };
      }
      
      return { status: false, message: "User details not found" };
    } catch (error) {
      logger.error(`Error in UserRepository.getUserDetailsById: ${generateError(error)}`);
      return { status: false, message: "Failed to fetch user details" };
    }
  };

  const getUserDetailsByEmail = async (email: string): Promise<SingleUserDetailsDBResponse> => {
    try {
      const sql = `SELECT * FROM ${userDetailsTable} WHERE email = ?`;
      const result = await MySql.query<UserDetails[]>(sql, [email]);
      
      if (result.status && result.data && result.data.length > 0) {
        return { status: true, data: result.data[0] };
      }
      
      return { status: false, message: "User details not found" };
    } catch (error) {
      logger.error(`Error in UserRepository.getUserDetailsByEmail: ${generateError(error)}`);
      return { status: false, message: "Failed to fetch user details" };
    }
  };

  // Subscription CRUD operations
  const createSubscription = async (subscriptionData: CreateSubscriptionRequest): Promise<SingleSubscriptionDBResponse> => {
    try {
      const totalAmount = subscriptionData.base_amount - (subscriptionData.discount_amount || 0);
      
      const sql = `
        INSERT INTO ${subscriptionTable} (subscription_id, user_id, cms_user_id, plan_id, base_amount, discount_amount, total_amount, coupon_code, discount_type, razorpay_order_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        subscriptionData.subscription_id,
        subscriptionData.user_id,
        subscriptionData.cms_user_id || null,
        subscriptionData.plan_id,
        subscriptionData.base_amount,
        subscriptionData.discount_amount || 0,
        totalAmount,
        subscriptionData.coupon_code || null,
        subscriptionData.discount_type || null,
        subscriptionData.razorpay_order_id || null
      ];

      const result = await MySql.query(sql, params);
      
      if (result.status) {
        return await getSubscriptionById(subscriptionData.subscription_id);
      }
      
      return { status: false, message: "Failed to create subscription" };
    } catch (error) {
      logger.error(`Error in UserRepository.createSubscription: ${generateError(error)}`);
      return { status: false, message: "Failed to create subscription" };
    }
  };

  const getSubscriptionById = async (subscriptionId: string): Promise<SingleSubscriptionDBResponse> => {
    try {
      const sql = `SELECT * FROM ${subscriptionTable} WHERE subscription_id = ?`;
      const result = await MySql.query<Subscription[]>(sql, [subscriptionId]);
      
      if (result.status && result.data && result.data.length > 0) {
        return { status: true, data: result.data[0] };
      }
      
      return { status: false, message: "Subscription not found" };
    } catch (error) {
      logger.error(`Error in UserRepository.getSubscriptionById: ${generateError(error)}`);
      return { status: false, message: "Failed to fetch subscription" };
    }
  };

  const getSubscriptions = async (
    page: number = 1,
    limit: number = 10,
    filters: SubscriptionSearchFilters = {}
  ): Promise<SubscriptionDBResponse> => {
    try {
      const offset = (page - 1) * limit;
      let whereClause = "WHERE 1=1";
      const params: any[] = [];

      if (filters.user_id) {
        whereClause += " AND user_id = ?";
        params.push(filters.user_id);
      }

      if (filters.cms_user_id) {
        whereClause += " AND cms_user_id = ?";
        params.push(filters.cms_user_id);
      }

      if (filters.plan_id) {
        whereClause += " AND plan_id = ?";
        params.push(filters.plan_id);
      }

      if (filters.status) {
        whereClause += " AND status = ?";
        params.push(filters.status);
      }

      if (filters.payment_status) {
        whereClause += " AND payment_status = ?";
        params.push(filters.payment_status);
      }

      if (filters.search) {
        whereClause += " AND (user_id LIKE ? OR plan_id LIKE ? OR subscription_id LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (filters.start_date) {
        whereClause += " AND DATE(created_at) >= ?";
        params.push(filters.start_date);
      }

      if (filters.end_date) {
        whereClause += " AND DATE(created_at) <= ?";
        params.push(filters.end_date);
      }

      const sql = `
        SELECT * FROM ${subscriptionTable} 
        ${whereClause} 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      params.push(limit, offset);
      
      const result = await MySql.query<Subscription[]>(sql, params);
      return result;
    } catch (error) {
      logger.error(`Error in UserRepository.getSubscriptions: ${generateError(error)}`);
      return { status: false, message: "Failed to fetch subscriptions" };
    }
  };

  const getSubscriptionsCount = async (filters: SubscriptionSearchFilters = {}): Promise<CountDBResponse> => {
    try {
      let whereClause = "WHERE 1=1";
      const params: any[] = [];

      if (filters.user_id) {
        whereClause += " AND user_id = ?";
        params.push(filters.user_id);
      }

      if (filters.cms_user_id) {
        whereClause += " AND cms_user_id = ?";
        params.push(filters.cms_user_id);
      }

      if (filters.plan_id) {
        whereClause += " AND plan_id = ?";
        params.push(filters.plan_id);
      }

      if (filters.status) {
        whereClause += " AND status = ?";
        params.push(filters.status);
      }

      if (filters.payment_status) {
        whereClause += " AND payment_status = ?";
        params.push(filters.payment_status);
      }

      if (filters.search) {
        whereClause += " AND (user_id LIKE ? OR plan_id LIKE ? OR subscription_id LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (filters.start_date) {
        whereClause += " AND DATE(created_at) >= ?";
        params.push(filters.start_date);
      }

      if (filters.end_date) {
        whereClause += " AND DATE(created_at) <= ?";
        params.push(filters.end_date);
      }

      const sql = `SELECT COUNT(*) as count FROM ${subscriptionTable} ${whereClause}`;
      const result = await MySql.query<{ count: number }[]>(sql, params);
      
      if (result.status && result.data && result.data.length > 0) {
        return { status: true, data: result.data[0] };
      }
      
      return { status: false, message: "Failed to get count" };
    } catch (error) {
      logger.error(`Error in UserRepository.getSubscriptionsCount: ${generateError(error)}`);
      return { status: false, message: "Failed to get subscriptions count" };
    }
  };

  return {
    // User operations
    getUserByEmail,
    getUserById,
    createUser,
    updateUser,
    updateLastLogin,
    getUsers,
    getUsersCount,
    
    // User Details operations
    createUserDetails,
    getUserDetailsById,
    getUserDetailsByEmail,
    
    // Subscription operations
    createSubscription,
    getSubscriptionById,
    getSubscriptions,
    getSubscriptionsCount,
  };
};

export default UserRepository; 