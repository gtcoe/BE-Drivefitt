import MySql from "../database/mySql";
import { logger } from "../logging";
import { generateError } from "../services/util";
import constants from "../config/constants/drivefitt-constants";
import { ContactUs, ContactUsSearchFilters } from "../models/ContactUs/contactUs";

export interface ContactUsDBResponse {
  status: boolean;
  data?: ContactUs[] | null;
  message?: string;
}

export interface CountDBResponse {
  status: boolean;
  data?: { count: number } | null;
  message?: string;
}

const ContactUsRepository = () => {
  const tableName = constants.TABLES.CONTACT_US;

  const getContactUsEntries = async (
    page: number = 1,
    limit: number = 10,
    filters: ContactUsSearchFilters = {}
  ): Promise<ContactUsDBResponse> => {
    try {
      const offset = (page - 1) * limit;
      let whereClause = "WHERE 1=1";
      const params: any[] = [];

      if (filters.first_name) {
        whereClause += " AND first_name LIKE ?";
        params.push(`%${filters.first_name}%`);
      }

      if (filters.last_name) {
        whereClause += " AND last_name LIKE ?";
        params.push(`%${filters.last_name}%`);
      }

      if (filters.email) {
        whereClause += " AND email LIKE ?";
        params.push(`%${filters.email}%`);
      }

      if (filters.phone) {
        whereClause += " AND phone LIKE ?";
        params.push(`%${filters.phone}%`);
      }

      if (filters.search) {
        whereClause += " AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ? OR message LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
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
      
      const result = await MySql.query<ContactUs[]>(sql, params);
      return result;
    } catch (error) {
      logger.error(`Error in ContactUsRepository.getContactUsEntries: ${generateError(error)}`);
      return { status: false, message: "Failed to fetch contact us entries" };
    }
  };

  const getContactUsCount = async (filters: ContactUsSearchFilters = {}): Promise<CountDBResponse> => {
    try {
      let whereClause = "WHERE 1=1";
      const params: any[] = [];

      if (filters.first_name) {
        whereClause += " AND first_name LIKE ?";
        params.push(`%${filters.first_name}%`);
      }

      if (filters.last_name) {
        whereClause += " AND last_name LIKE ?";
        params.push(`%${filters.last_name}%`);
      }

      if (filters.email) {
        whereClause += " AND email LIKE ?";
        params.push(`%${filters.email}%`);
      }

      if (filters.phone) {
        whereClause += " AND phone LIKE ?";
        params.push(`%${filters.phone}%`);
      }

      if (filters.search) {
        whereClause += " AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ? OR message LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
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
      logger.error(`Error in ContactUsRepository.getContactUsCount: ${generateError(error)}`);
      return { status: false, message: "Failed to get contact us count" };
    }
  };

  const getAllContactUsForExport = async (filters: ContactUsSearchFilters = {}): Promise<ContactUsDBResponse> => {
    try {
      let whereClause = "WHERE 1=1";
      const params: any[] = [];

      if (filters.first_name) {
        whereClause += " AND first_name LIKE ?";
        params.push(`%${filters.first_name}%`);
      }

      if (filters.last_name) {
        whereClause += " AND last_name LIKE ?";
        params.push(`%${filters.last_name}%`);
      }

      if (filters.email) {
        whereClause += " AND email LIKE ?";
        params.push(`%${filters.email}%`);
      }

      if (filters.phone) {
        whereClause += " AND phone LIKE ?";
        params.push(`%${filters.phone}%`);
      }

      if (filters.search) {
        whereClause += " AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ? OR message LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
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
      
      const result = await MySql.query<ContactUs[]>(sql, params);
      return result;
    } catch (error) {
      logger.error(`Error in ContactUsRepository.getAllContactUsForExport: ${generateError(error)}`);
      return { status: false, message: "Failed to fetch contact us entries for export" };
    }
  };

  return {
    getContactUsEntries,
    getContactUsCount,
    getAllContactUsForExport,
  };
};

export default ContactUsRepository; 