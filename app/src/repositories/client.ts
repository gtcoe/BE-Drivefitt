import constants from "../config/constants/constants";
import { generateError } from "../services/util";
import { logger } from "../logging";
import Mysql from "../database/mySql";
import { AddClientRequest } from "../models/Client/addClientRequest";

export interface ClientData {
  id: number;
  user_id: number;
  name: string;
  type: number;
  address: string;
  branch: string;
  gst_number: string;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  spoke_name: string;
  spoke_phone: string;
  spoke_email: string;
  billing_cycle: string;
  country: number;
  state: number;
  city: string;
  zipcode: string;
  last_updated_by: number;
}

export interface GetClientDataDBResponse {
  status: boolean;
  data: ClientData[] | null;
}

const clientRepository = () => {
  //Done
  const insert = async (data: AddClientRequest): Promise<any> => {
    try {
      const query = `INSERT INTO ${constants.TABLES.CLIENT} 
                (user_id, name, type, address, branches, gst_number, owner_name, owner_phone, owner_email, spoke_name, spoke_phone, spoke_email, billing_cycle, country, state, city, zipcode, last_updated_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [
        data.user_id,
        data.name,
        data.type,
        data.address,
        data.branches,
        data.gst_number,
        data.owner_name,
        data.owner_phone,
        data.owner_email,
        data.spoke_name,
        data.spoke_phone,
        data.spoke_email,
        data.billing_cycle,
        data.country,
        data.state,
        data.city,
        data.zip_code,
        data.last_updated_by,
      ];
      const resp = await Mysql.query(query, params);
      if (resp.data?.insertId) {
        insertHistory(resp.data.insertId);
      }
      return resp;
    } catch (e) {
      logger.error(`Error in insert: ${generateError(e)}`);
      throw e;
    }
  };

  //Done
  const insertHistory = async (clientId: number | undefined): Promise<void> => {
    try {
      const query = `INSERT INTO ${constants.TABLES.CLIENT_HISTORY} 
                (client_id, user_id, type, address, branches, gst_number, owner_name, owner_phone, owner_email, spoke_name, spoke_phone, spoke_email, billing_cycle, country, state, city, zipcode, last_updated_by) 
                SELECT id, user_id, type, address, branches, gst_number, owner_name, owner_phone, owner_email, spoke_name, spoke_phone, spoke_email, billing_cycle, country, state, city, zipcode, last_updated_by 
                FROM ${constants.TABLES.CLIENT} WHERE id = ?`;
      await Mysql.query(query, [clientId]);
    } catch (e) {
      logger.error(`Error in insertHistory: ${generateError(e)}`);
      throw e;
    }
  };

  //Done
  const getByUserId = async (
    user_id: number
  ): Promise<GetClientDataDBResponse> => {
    try {
      const query = `SELECT id, name, user_id, type, address, branches, gst_number, owner_name, owner_phone, owner_email, spoke_name, spoke_phone, spoke_email, billing_cycle, country, state, city, zipcode, last_updated_by FROM ${constants.TABLES.CLIENT} WHERE user_id = ?`;
      const params = [user_id];
      return await Mysql.query<ClientData[]>(query, params);
    } catch (e) {
      logger.error(`Error in getUserByID: ${generateError(e)}`);
      throw e;
    }
  };

  //Done
  const getAll = async (): Promise<GetClientDataDBResponse> => {
    try {
      const query = `SELECT id, name, user_id, type, address, branches, gst_number, owner_name, owner_phone, owner_email, spoke_name, spoke_phone, spoke_email, billing_cycle, country, state, city, zipcode, last_updated_by FROM ${constants.TABLES.CLIENT} order by id desc`;
      return await Mysql.query<ClientData[]>(query, []);
    } catch (e) {
      logger.error(`Error in getAllUsers: ${generateError(e)}`);
      throw e;
    }
  };

  //Done
  const getClientByEmail = async (
    emails: string[]
  ): Promise<GetClientDataDBResponse> => {
    try {
      let param = "";
      for (const email of emails) {
        param += `'${email}',`;
      }
      param = param.slice(0, -1);
      const query = `SELECT id, name, user_id, type, address, branches, gst_number, owner_name, owner_phone, owner_email, spoke_name, spoke_phone, spoke_email, billing_cycle, country, state, city, zipcode, last_updated_by FROM ${constants.TABLES.CLIENT} WHERE owner_email in (${param}) ORDER BY id DESC`;

      return await Mysql.query<ClientData[]>(query, []);
    } catch (e) {
      logger.error(`Error in getClientByEmail: ${generateError(e)}`);
      throw e;
    }
  };

  /**
   * Get clients by client type
   * @param clientType The type of client to filter by (1=Corporate, 2=Agent, 3=Walk-in)
   * @returns List of clients of the specified type
   */
  const getClientsByType = async (clientType: number) => {
    try {
      const query = `SELECT user_id, name FROM ${constants.TABLES.CLIENT} WHERE type = ? ORDER BY name ASC`;
    
      return await Mysql.query<ClientData[]>(query, [clientType]);

    } catch (error) {
      console.error("Error in getClientsByType repository:", error);
      throw error;
    }
  };

  const search = async (text: string): Promise<GetClientDataDBResponse> => {
    try {
      const query = `SELECT id, user_id, name, type, address, branches, gst_number, owner_name, owner_phone, owner_email, spoke_name, spoke_phone, spoke_email, country, state, city, zipcode 
                    FROM ${constants.TABLES.CLIENT} 
                    WHERE owner_email LIKE ? OR spoke_email LIKE ? 
                    ORDER BY id DESC`;
      const params = [`%${text}%`, `%${text}%`];
      return await Mysql.query<ClientData[]>(query, params);
    } catch (e) {
      logger.error(`Error in search clients: ${generateError(e)}`);
      throw e;
    }
  };

  /**
   * Get client by client_user_id
   * @param clientId The user ID associated with the client
   * @returns Client data for the specified user ID
   */
  const getByClientId = async (
    clientId: number
  ): Promise<GetClientDataDBResponse> => {
    try {
      const query = `SELECT id, name, user_id, type, address, branches, gst_number, owner_name, owner_phone, owner_email, spoke_name, spoke_phone, spoke_email, billing_cycle, country, state, city, zipcode, last_updated_by 
                     FROM ${constants.TABLES.CLIENT} 
                     WHERE id = ?`;
      const params = [clientId];
      return await Mysql.query<ClientData[]>(query, params);
    } catch (e) {
      logger.error(`Error in getByClientId: ${generateError(e)}`);
      throw e;
    }
  };

  return {
    insert,
    insertHistory,
    getAll,
    getByUserId,
    getClientByEmail,
    getClientsByType,
    search,
    getByClientId
  };
};

export default clientRepository;
