import MySql from "../database/mySql";
import { logger } from "../logging";
import { generateError } from "../services/util";
import constants from "../config/constants/drivefitt-constants";
import { Admin, CreateAdminRequest, UpdateAdminRequest } from "../models/Admin/admin";

export interface AdminDBResponse {
  status: boolean;
  data?: Admin[] | null;
  message?: string;
}

export interface SingleAdminDBResponse {
  status: boolean;
  data?: Admin | null;
  message?: string;
}

const AdminRepository = () => {
  const tableName = constants.TABLES.ADMINS;

  const getAdminByEmail = async (email: string): Promise<SingleAdminDBResponse> => {
    try {
      const sql = `SELECT * FROM ${tableName} WHERE email = ?`;
      const result = await MySql.query<Admin[]>(sql, [email]);
      
      if (result.status && result.data && result.data.length > 0) {
        return { status: true, data: result.data[0] };
      }
      
      return { status: false, message: "Admin not found" };
    } catch (error) {
      logger.error(`Error in AdminRepository.getAdminByEmail: ${generateError(error)}`);
      return { status: false, message: "Failed to fetch admin" };
    }
  };

  const getAdminByPhone = async (phone: string): Promise<SingleAdminDBResponse> => {
    try {
      const sql = `SELECT * FROM ${tableName} WHERE phone = ?`;
      const result = await MySql.query<Admin[]>(sql, [phone]);
      
      if (result.status && result.data && result.data.length > 0) {
        return { status: true, data: result.data[0] };
      }
      
      return { status: false, message: "Admin not found" };
    } catch (error) {
      logger.error(`Error in AdminRepository.getAdminByPhone: ${generateError(error)}`);
      return { status: false, message: "Failed to fetch admin" };
    }
  };

  const getAdminById = async (id: number): Promise<SingleAdminDBResponse> => {
    try {
      const sql = `SELECT * FROM ${tableName} WHERE id = ?`;
      const result = await MySql.query<Admin[]>(sql, [id]);
      
      if (result.status && result.data && result.data.length > 0) {
        return { status: true, data: result.data[0] };
      }
      
      return { status: false, message: "Admin not found" };
    } catch (error) {
      logger.error(`Error in AdminRepository.getAdminById: ${generateError(error)}`);
      return { status: false, message: "Failed to fetch admin" };
    }
  };

  const createAdmin = async (adminData: CreateAdminRequest): Promise<SingleAdminDBResponse> => {
    try {
      const sql = `
        INSERT INTO ${tableName} (email, phone, password, name, status) 
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const params = [
        adminData.email,
        adminData.phone,
        adminData.password,
        adminData.name,
        adminData.status || constants.STATUS.ADMIN.ACTIVE
      ];

      const result = await MySql.query(sql, params);
      
      if (result.status && result.data && typeof result.data === 'object' && 'insertId' in result.data) {
        return await getAdminById(result.data.insertId);
      }
      
      return { status: false, message: "Failed to create admin" };
    } catch (error) {
      logger.error(`Error in AdminRepository.createAdmin: ${generateError(error)}`);
      return { status: false, message: "Failed to create admin" };
    }
  };

  const updateAdmin = async (adminData: UpdateAdminRequest): Promise<SingleAdminDBResponse> => {
    try {
      const fields: string[] = [];
      const params: any[] = [];

      if (adminData.email !== undefined) {
        fields.push("email = ?");
        params.push(adminData.email);
      }
      if (adminData.phone !== undefined) {
        fields.push("phone = ?");
        params.push(adminData.phone);
      }
      if (adminData.name !== undefined) {
        fields.push("name = ?");
        params.push(adminData.name);
      }
      if (adminData.status !== undefined) {
        fields.push("status = ?");
        params.push(adminData.status);
      }

      if (fields.length === 0) {
        return { status: false, message: "No fields to update" };
      }

      fields.push("updated_at = CURRENT_TIMESTAMP");
      params.push(adminData.id);

      const sql = `UPDATE ${tableName} SET ${fields.join(", ")} WHERE id = ?`;
      const result = await MySql.query(sql, params);
      
      if (result.status) {
        return await getAdminById(adminData.id);
      }
      
      return { status: false, message: "Failed to update admin" };
    } catch (error) {
      logger.error(`Error in AdminRepository.updateAdmin: ${generateError(error)}`);
      return { status: false, message: "Failed to update admin" };
    }
  };

  const updateLastLogin = async (id: number): Promise<{ status: boolean; message?: string }> => {
    try {
      const sql = `UPDATE ${tableName} SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?`;
      const result = await MySql.query(sql, [id]);
      
      if (result.status) {
        return { status: true };
      }
      
      return { status: false, message: "Failed to update last login" };
    } catch (error) {
      logger.error(`Error in AdminRepository.updateLastLogin: ${generateError(error)}`);
      return { status: false, message: "Failed to update last login" };
    }
  };

  const updatePassword = async (id: number, hashedPassword: string): Promise<{ status: boolean; message?: string }> => {
    try {
      const sql = `UPDATE ${tableName} SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      const result = await MySql.query(sql, [hashedPassword, id]);
      
      if (result.status) {
        return { status: true };
      }
      
      return { status: false, message: "Failed to update password" };
    } catch (error) {
      logger.error(`Error in AdminRepository.updatePassword: ${generateError(error)}`);
      return { status: false, message: "Failed to update password" };
    }
  };

  return {
    getAdminByEmail,
    getAdminByPhone,
    getAdminById,
    createAdmin,
    updateAdmin,
    updateLastLogin,
    updatePassword,
  };
};

export default AdminRepository; 