import MySql from "../database/mySql";
import { logger } from "../logging";
import { generateError } from "../services/util";
import constants from "../config/constants/drivefitt-constants";
import { Franchise, FranchiseSearchFilters } from "../models/Franchise/franchise";

export interface FranchiseDBResponse {
  status: boolean;
  data?: Franchise[] | null;
  message?: string;
}

export interface CountDBResponse {
  status: boolean;
  data?: { count: number } | null;
  message?: string;
}

const FranchiseRepository = () => {
  const tableName = constants.TABLES.FRANCHISE_INQUIRIES;

  const getFranchiseInquiries = async (
    page: number = 1,
    limit: number = 10,
    filters: FranchiseSearchFilters = {}
  ): Promise<FranchiseDBResponse> => {
    try {
      const offset = (page - 1) * limit;
      let whereClause = "WHERE 1=1";
      const params: any[] = [];

      if (filters.city) {
        whereClause += " AND city LIKE ?";
        params.push(`%${filters.city}%`);
      }

      if (filters.state) {
        whereClause += " AND state LIKE ?";
        params.push(`%${filters.state}%`);
      }

      if (filters.status) {
        whereClause += " AND status = ?";
        params.push(filters.status);
      }

      if (filters.assigned_to) {
        whereClause += " AND assigned_to = ?";
        params.push(filters.assigned_to);
      }

      if (filters.search) {
        whereClause += " AND (business_name LIKE ? OR contact_person LIKE ? OR email LIKE ? OR phone LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (filters.date_from) {
        whereClause += " AND DATE(created_at) >= ?";
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        whereClause += " AND DATE(created_at) <= ?";
        params.push(filters.date_to);
      }

      if (filters.investment_capacity_min) {
        whereClause += " AND investment_capacity >= ?";
        params.push(filters.investment_capacity_min);
      }

      if (filters.investment_capacity_max) {
        whereClause += " AND investment_capacity <= ?";
        params.push(filters.investment_capacity_max);
      }

      const sql = `
        SELECT * FROM ${tableName} 
        ${whereClause} 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      params.push(limit, offset);
      
      const result = await MySql.query<Franchise[]>(sql, params);
      return result;
    } catch (error) {
      logger.error(`Error in FranchiseRepository.getFranchiseInquiries: ${generateError(error)}`);
      return { status: false, message: "Failed to fetch franchise inquiries" };
    }
  };

  const getFranchiseCount = async (filters: FranchiseSearchFilters = {}): Promise<CountDBResponse> => {
    try {
      let whereClause = "WHERE 1=1";
      const params: any[] = [];

      if (filters.city) {
        whereClause += " AND city LIKE ?";
        params.push(`%${filters.city}%`);
      }

      if (filters.state) {
        whereClause += " AND state LIKE ?";
        params.push(`%${filters.state}%`);
      }

      if (filters.status) {
        whereClause += " AND status = ?";
        params.push(filters.status);
      }

      if (filters.assigned_to) {
        whereClause += " AND assigned_to = ?";
        params.push(filters.assigned_to);
      }

      if (filters.search) {
        whereClause += " AND (business_name LIKE ? OR contact_person LIKE ? OR email LIKE ? OR phone LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (filters.date_from) {
        whereClause += " AND DATE(created_at) >= ?";
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        whereClause += " AND DATE(created_at) <= ?";
        params.push(filters.date_to);
      }

      if (filters.investment_capacity_min) {
        whereClause += " AND investment_capacity >= ?";
        params.push(filters.investment_capacity_min);
      }

      if (filters.investment_capacity_max) {
        whereClause += " AND investment_capacity <= ?";
        params.push(filters.investment_capacity_max);
      }

      const sql = `SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`;
      const result = await MySql.query<{ count: number }[]>(sql, params);
      
      if (result.status && result.data && result.data.length > 0) {
        return { status: true, data: result.data[0] };
      }
      
      return { status: false, message: "Failed to get count" };
    } catch (error) {
      logger.error(`Error in FranchiseRepository.getFranchiseCount: ${generateError(error)}`);
      return { status: false, message: "Failed to get franchise count" };
    }
  };

  const getAllFranchiseForExport = async (filters: FranchiseSearchFilters = {}): Promise<FranchiseDBResponse> => {
    try {
      let whereClause = "WHERE 1=1";
      const params: any[] = [];

      if (filters.city) {
        whereClause += " AND city LIKE ?";
        params.push(`%${filters.city}%`);
      }

      if (filters.state) {
        whereClause += " AND state LIKE ?";
        params.push(`%${filters.state}%`);
      }

      if (filters.status) {
        whereClause += " AND status = ?";
        params.push(filters.status);
      }

      if (filters.assigned_to) {
        whereClause += " AND assigned_to = ?";
        params.push(filters.assigned_to);
      }

      if (filters.search) {
        whereClause += " AND (business_name LIKE ? OR contact_person LIKE ? OR email LIKE ? OR phone LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (filters.date_from) {
        whereClause += " AND DATE(created_at) >= ?";
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        whereClause += " AND DATE(created_at) <= ?";
        params.push(filters.date_to);
      }

      if (filters.investment_capacity_min) {
        whereClause += " AND investment_capacity >= ?";
        params.push(filters.investment_capacity_min);
      }

      if (filters.investment_capacity_max) {
        whereClause += " AND investment_capacity <= ?";
        params.push(filters.investment_capacity_max);
      }

      const sql = `
        SELECT * FROM ${tableName} 
        ${whereClause} 
        ORDER BY created_at DESC
      `;
      
      const result = await MySql.query<Franchise[]>(sql, params);
      return result;
    } catch (error) {
      logger.error(`Error in FranchiseRepository.getAllFranchiseForExport: ${generateError(error)}`);
      return { status: false, message: "Failed to fetch franchise inquiries for export" };
    }
  };

  return {
    getFranchiseInquiries,
    getFranchiseCount,
    getAllFranchiseForExport,
  };
};

export default FranchiseRepository; 