import constants from "../config/constants/constants";
import { generateError } from "../services/util";
import { logger } from "../logging";
import Mysql from "../database/mySql";
import moment from "moment";
import { AddUserRequest } from "../models/User/addUserRequest";

export interface UserData {
  id: number;
  name: string;
  email: string;
  password: string;
  status: number;
  type: number;
  password_valid_till: string;
  password_requested: number;
  last_updated_by: number;
  last_logged_in_at: number;
  created_at: string;
}

export interface GetUserDataDBResponse {
  status: boolean;
  data: UserData[] | null;
}

const userRepository = () => {
  //Done
  const insertUser = async (data: AddUserRequest): Promise<any> => {
    try {
      const query = `INSERT INTO ${constants.TABLES.USER} 
                (name, email, password, status, type, password_valid_till, last_updated_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const params = [
        data.name,
        data.email,
        data.password,
        data.status,
        data.type,
        data.password_valid_till,
        data.last_updated_by,
      ];
      const resp = await Mysql.query(query, params);

      if (resp.data?.insertId) {
        insertUserHistory(resp.data.insertId);
      }
      return resp;
    } catch (e) {
      logger.error(`Error in insertUser: ${generateError(e)}`);
      throw e;
    }
  };

  //Done
  const insertUserHistory = async (
    userId: number | undefined
  ): Promise<void> => {
    try {
      const query = `INSERT INTO ${constants.TABLES.USER_HISTORY} 
                (user_id, name, email, password, status, last_updated_by, type, password_valid_till, last_logged_in_at, password_requested) 
                SELECT id, name, email, password, status, last_updated_by, type, password_valid_till, last_logged_in_at, password_requested 
                FROM ${constants.TABLES.USER} WHERE id = ?`;
      await Mysql.query(query, [userId]);
    } catch (e) {
      logger.error(`Error in insertUserHistory: ${generateError(e)}`);
      throw e;
    }
  };

  //Done
  const updateStatusAndPassword = async (
    status: number,
    password: string,
    userId: number,
    lastUpdatedBy: number
  ): Promise<any> => {
    try {
      const expiryTime = moment().add(30, "days").format("YYYY-MM-DD HH:mm:ss");
      const query = `UPDATE ${constants.TABLES.USER} 
                SET status = ?, password = ?, password_valid_till = ?, last_updated_by = ? 
                WHERE id = ?`;
      const params = [status, password, expiryTime, lastUpdatedBy, userId];
      const resp = await Mysql.query(query, params);
      if (resp.data.affectedRows > 0) {
        insertUserHistory(userId);
      }
      return resp;
    } catch (e) {
      logger.error(`Error in updateStatusAndPassword: ${generateError(e)}`);
      throw e;
    }
  };

  //Done
  // Expiry not getting shifted
  const updateStatus = async (
    status: number,
    userId: number,
    lastUpdatedBy: number
  ): Promise<any> => {
    try {
      const query = `UPDATE ${constants.TABLES.USER} 
                SET status = ?, last_updated_by = ? 
                WHERE id = ?`;
      const params = [status, lastUpdatedBy, userId];
      const resp = await Mysql.query(query, params);
      if (resp.data.affectedRows > 0) {
        insertUserHistory(userId);
      }
      return resp;
    } catch (e) {
      logger.error(`Error in updateStatus: ${generateError(e)}`);
      throw e;
    }
  };

  //Done
  const getByID = async (id: number): Promise<GetUserDataDBResponse> => {
    try {
      const query = `SELECT id, name, email, password, status, type, password_requested, last_updated_by, password_valid_till FROM ${constants.TABLES.USER} WHERE id = ?`;
      const params = [id];
      return await Mysql.query<UserData[]>(query, params);
    } catch (e) {
      logger.error(`Error in getUserByID: ${generateError(e)}`);
      throw e;
    }
  };

  //Done
  const getAll = async (): Promise<GetUserDataDBResponse> => {
    try {
      const query = `SELECT id, name, email, status, type, created_at, last_logged_in_at FROM ${constants.TABLES.USER} order by id desc`;
      return await Mysql.query<UserData[]>(query, []);
    } catch (e) {
      logger.error(`Error in getAllUsers: ${generateError(e)}`);
      throw e;
    }
  };

  //Done
  const getUserByEmail = async (
    email: string
  ): Promise<GetUserDataDBResponse> => {
    try {
      const query = `SELECT id, name, email, password, status, type, password_requested, last_updated_by, password_valid_till  FROM ${constants.TABLES.USER} WHERE email = ? ORDER BY id DESC LIMIT 1`;
      const params = [email];
      return await Mysql.query<UserData[]>(query, params);
    } catch (e) {
      logger.error(`Error in getUserByEmail: ${generateError(e)}`);
      throw e;
    }
  };

  //Done
  const search = async (text: string): Promise<GetUserDataDBResponse> => {
    try {
      const query = `SELECT id, name, email, status, type FROM ${constants.TABLES.USER} WHERE email LIKE ? ORDER BY id DESC`;
      const params = [`%${text}%`];
      return await Mysql.query<UserData[]>(query, params);
    } catch (e) {
      logger.error(`Error in search: ${generateError(e)}`);
      throw e;
    }
  };

  //done
  const updateAfterSuccessfulLogin = async (
    userId: number | undefined
  ): Promise<void> => {
    const currentTime = moment().format("YYYY-MM-DD HH:mm:ss");
    const expiryTime = moment().add(30, "days").format("YYYY-MM-DD HH:mm:ss");
    try {
      const query = `UPDATE ${constants.TABLES.USER} 
                SET last_logged_in_at = ?, password_valid_till = ? 
                WHERE id = ?`;
      const params = [currentTime, expiryTime, userId];
      const resp = await Mysql.query(query, params);
      if (resp.data.affectedRows > 0) {
        await insertUserHistory(userId);
      }
    } catch (e) {
      logger.error(`Error in updateAfterSuccessfulLogin: ${generateError(e)}`);
      throw e;
    }
  };

  const getUsersByType = async (
    type: number,
    email: string,
    pageNo: number,
    pageSize: number = 10
  ): Promise<GetUserDataDBResponse> => {
    try {
      let query = `SELECT id, name, email, password, status, type, password_requested, last_updated_by, password_valid_till  FROM ${constants.TABLES.USER} 
                WHERE type = ? AND status = ? `;

      if (email.length > 0) {
        query += ` AND email like "%${email}%" `;
      }
      const offset = (pageNo - 1) * pageSize;
      query += ` LIMIT ${pageSize} OFFSET ${offset} ORDER BY id DESC`;
      const params = [type, constants.STATUS.USER.ACTIVE];
      return await Mysql.query<UserData[]>(query, params);
    } catch (e) {
      logger.error(`Error in getUsersByType: ${generateError(e)}`);
      throw e;
    }
  };

  return {
    insertUser,
    insertUserHistory,
    updateStatusAndPassword,
    getAll,
    getByID,
    getUserByEmail,
    search,
    updateAfterSuccessfulLogin,
    getUsersByType,
    updateStatus,
  };
};

export default userRepository;
