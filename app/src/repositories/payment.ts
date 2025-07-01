import MySql from "../database/mySql";
import { logger } from "../logging";
import { generateError } from "../services/util";
import constants from "../config/constants/drivefitt-constants";
import { Payment, PaymentSearchFilters } from "../models/Payment/payment";

export interface PaymentDBResponse {
  status: boolean;
  data?: Payment[] | null;
  message?: string;
}

export interface CountDBResponse {
  status: boolean;
  data?: { count: number } | null;
  message?: string;
}

const PaymentRepository = () => {
  const tableName = constants.TABLES.PAYMENTS;

  const getPayments = async (
    page: number = 1,
    limit: number = 10,
    filters: PaymentSearchFilters = {}
  ): Promise<PaymentDBResponse> => {
    try {
      const offset = (page - 1) * limit;
      let whereClause = "WHERE 1=1";
      const params: any[] = [];

      if (filters.user_email) {
        whereClause += " AND user_email LIKE ?";
        params.push(`%${filters.user_email}%`);
      }

      if (filters.transaction_id) {
        whereClause += " AND transaction_id LIKE ?";
        params.push(`%${filters.transaction_id}%`);
      }

      if (filters.status) {
        whereClause += " AND status = ?";
        params.push(filters.status);
      }

      if (filters.payment_method) {
        whereClause += " AND payment_method = ?";
        params.push(filters.payment_method);
      }

      if (filters.min_amount) {
        whereClause += " AND amount >= ?";
        params.push(filters.min_amount);
      }

      if (filters.max_amount) {
        whereClause += " AND amount <= ?";
        params.push(filters.max_amount);
      }

      if (filters.search) {
        whereClause += " AND (user_email LIKE ? OR transaction_id LIKE ? OR payment_method LIKE ?)";
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
      
      const result = await MySql.query<Payment[]>(sql, params);
      return result;
    } catch (error) {
      logger.error(`Error in PaymentRepository.getPayments: ${generateError(error)}`);
      return { status: false, message: "Failed to fetch payments" };
    }
  };

  const getPaymentsCount = async (filters: PaymentSearchFilters = {}): Promise<CountDBResponse> => {
    try {
      let whereClause = "WHERE 1=1";
      const params: any[] = [];

      if (filters.user_email) {
        whereClause += " AND user_email LIKE ?";
        params.push(`%${filters.user_email}%`);
      }

      if (filters.transaction_id) {
        whereClause += " AND transaction_id LIKE ?";
        params.push(`%${filters.transaction_id}%`);
      }

      if (filters.status) {
        whereClause += " AND status = ?";
        params.push(filters.status);
      }

      if (filters.payment_method) {
        whereClause += " AND payment_method = ?";
        params.push(filters.payment_method);
      }

      if (filters.min_amount) {
        whereClause += " AND amount >= ?";
        params.push(filters.min_amount);
      }

      if (filters.max_amount) {
        whereClause += " AND amount <= ?";
        params.push(filters.max_amount);
      }

      if (filters.search) {
        whereClause += " AND (user_email LIKE ? OR transaction_id LIKE ? OR payment_method LIKE ?)";
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

      const sql = `SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`;
      const result = await MySql.query<{ count: number }[]>(sql, params);
      
      if (result.status && result.data && result.data.length > 0) {
        return { status: true, data: result.data[0] };
      }
      
      return { status: false, message: "Failed to get count" };
    } catch (error) {
      logger.error(`Error in PaymentRepository.getPaymentsCount: ${generateError(error)}`);
      return { status: false, message: "Failed to get payments count" };
    }
  };

  const getAllPaymentsForExport = async (filters: PaymentSearchFilters = {}): Promise<PaymentDBResponse> => {
    try {
      let whereClause = "WHERE 1=1";
      const params: any[] = [];

      if (filters.user_email) {
        whereClause += " AND user_email LIKE ?";
        params.push(`%${filters.user_email}%`);
      }

      if (filters.transaction_id) {
        whereClause += " AND transaction_id LIKE ?";
        params.push(`%${filters.transaction_id}%`);
      }

      if (filters.status) {
        whereClause += " AND status = ?";
        params.push(filters.status);
      }

      if (filters.payment_method) {
        whereClause += " AND payment_method = ?";
        params.push(filters.payment_method);
      }

      if (filters.min_amount) {
        whereClause += " AND amount >= ?";
        params.push(filters.min_amount);
      }

      if (filters.max_amount) {
        whereClause += " AND amount <= ?";
        params.push(filters.max_amount);
      }

      if (filters.search) {
        whereClause += " AND (user_email LIKE ? OR transaction_id LIKE ? OR payment_method LIKE ?)";
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
      `;
      
      const result = await MySql.query<Payment[]>(sql, params);
      return result;
    } catch (error) {
      logger.error(`Error in PaymentRepository.getAllPaymentsForExport: ${generateError(error)}`);
      return { status: false, message: "Failed to fetch payments for export" };
    }
  };

  return {
    getPayments,
    getPaymentsCount,
    getAllPaymentsForExport,
  };
};

export default PaymentRepository; 