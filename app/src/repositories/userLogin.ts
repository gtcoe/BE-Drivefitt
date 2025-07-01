import MySql from "../database/mySql";
import { logger } from "../logging";
import { generateError } from "../services/util";
import constants from "../config/constants/drivefitt-constants";
import { UserLogin, UserLoginSearchFilters } from "../models/UserLogin/userLogin";

export interface UserLoginDBResponse {
  status: boolean;
  data?: UserLogin[] | null;
  message?: string;
}

export interface CountDBResponse {
  status: boolean;
  data?: { count: number } | null;
  message?: string;
}

export interface TrackUserLoginRequest {
  user_id?: number | null;
  email?: string | null;
  login_type?: 'web' | 'mobile' | 'api';
  ip_address?: string | null;
  user_agent?: string | null;
  device_info?: any;
  login_status?: 'success' | 'failed' | 'blocked';
  failure_reason?: string | null;
}

const UserLoginRepository = () => {
  const tableName = constants.TABLES.USER_LOGINS;

  const trackUserLogin = async (loginData: TrackUserLoginRequest): Promise<{ status: boolean; message?: string }> => {
    try {
      const sql = `
        INSERT INTO ${tableName} (user_id, email, login_type, ip_address, user_agent, device_info, login_status, failure_reason) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        loginData.user_id || null,
        loginData.email || null,
        loginData.login_type || 'web',
        loginData.ip_address || null,
        loginData.user_agent || null,
        loginData.device_info ? JSON.stringify(loginData.device_info) : null,
        loginData.login_status || 'success',
        loginData.failure_reason || null
      ];

      const result = await MySql.query(sql, params);
      
      if (result.status) {
        return { status: true };
      }
      
      return { status: false, message: "Failed to track user login" };
    } catch (error) {
      logger.error(`Error in UserLoginRepository.trackUserLogin: ${generateError(error)}`);
      return { status: false, message: "Failed to track user login" };
    }
  };

  const getUserLogins = async (
    page: number = 1,
    limit: number = 10,
    filters: UserLoginSearchFilters = {}
  ): Promise<UserLoginDBResponse> => {
    try {
      const offset = (page - 1) * limit;
      let whereClause = "WHERE 1=1";
      const params: any[] = [];

      if (filters.email) {
        whereClause += " AND email LIKE ?";
        params.push(`%${filters.email}%`);
      }

      if (filters.device_type) {
        whereClause += " AND device_type = ?";
        params.push(filters.device_type);
      }

      if (filters.platform) {
        whereClause += " AND platform LIKE ?";
        params.push(`%${filters.platform}%`);
      }

      if (filters.search) {
        whereClause += " AND (email LIKE ? OR device_type LIKE ? OR platform LIKE ?)";
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
        SELECT * FROM ${tableName} 
        ${whereClause} 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      params.push(limit, offset);
      
      const result = await MySql.query<UserLogin[]>(sql, params);
      return result;
    } catch (error) {
      logger.error(`Error in UserLoginRepository.getUserLogins: ${generateError(error)}`);
      return { status: false, message: "Failed to fetch user logins" };
    }
  };

  const getUserLoginsCount = async (filters: UserLoginSearchFilters = {}): Promise<CountDBResponse> => {
    try {
      let whereClause = "WHERE 1=1";
      const params: any[] = [];

      if (filters.email) {
        whereClause += " AND email LIKE ?";
        params.push(`%${filters.email}%`);
      }

      if (filters.device_type) {
        whereClause += " AND device_type = ?";
        params.push(filters.device_type);
      }

      if (filters.platform) {
        whereClause += " AND platform LIKE ?";
        params.push(`%${filters.platform}%`);
      }

      if (filters.search) {
        whereClause += " AND (email LIKE ? OR device_type LIKE ? OR platform LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (filters.start_date) {
        whereClause += " AND DATE(login_time) >= ?";
        params.push(filters.start_date);
      }

      if (filters.end_date) {
        whereClause += " AND DATE(login_time) <= ?";
        params.push(filters.end_date);
      }

      const sql = `SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`;
      const result = await MySql.query<{ count: number }[]>(sql, params);
      
      if (result.status && result.data && result.data.length > 0) {
        return { status: true, data: result.data[0] };
      }
      
      return { status: false, message: "Failed to get count" };
    } catch (error) {
      logger.error(`Error in UserLoginRepository.getUserLoginsCount: ${generateError(error)}`);
      return { status: false, message: "Failed to get user logins count" };
    }
  };

  const getAllUserLoginsForExport = async (filters: UserLoginSearchFilters = {}): Promise<UserLoginDBResponse> => {
    try {
      let whereClause = "WHERE 1=1";
      const params: any[] = [];

      if (filters.email) {
        whereClause += " AND email LIKE ?";
        params.push(`%${filters.email}%`);
      }

      if (filters.device_type) {
        whereClause += " AND device_type = ?";
        params.push(filters.device_type);
      }

      if (filters.platform) {
        whereClause += " AND platform LIKE ?";
        params.push(`%${filters.platform}%`);
      }

      if (filters.search) {
        whereClause += " AND (email LIKE ? OR device_type LIKE ? OR platform LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (filters.start_date) {
        whereClause += " AND DATE(login_time) >= ?";
        params.push(filters.start_date);
      }

      if (filters.end_date) {
        whereClause += " AND DATE(login_time) <= ?";
        params.push(filters.end_date);
      }

      const sql = `
        SELECT * FROM ${tableName} 
        ${whereClause} 
        ORDER BY created_at DESC
      `;
      
      const result = await MySql.query<UserLogin[]>(sql, params);
      return result;
    } catch (error) {
      logger.error(`Error in UserLoginRepository.getAllUserLoginsForExport: ${generateError(error)}`);
      return { status: false, message: "Failed to fetch user logins for export" };
    }
  };

  return {
    trackUserLogin,
    getUserLogins,
    getUserLoginsCount,
    getAllUserLoginsForExport,
  };
};

export const userLoginRepository = UserLoginRepository();
export default UserLoginRepository; 