import MySql from "../database/mySql";
import Response from "../models/response";
import { logger } from "../logging";
import { generateError } from "../services/util";
import constants from "../config/constants/constants";
export interface VisaRequestData {
  id?: number;
  visa_country: number;
  visa_category: number;
  nationality: number;
  state: number;
  entry_type: number;
  remarks: string;
  last_updated_by: number;
  created_at?: string;
  updated_at?: string;
}

export interface GetVisaRequestDataDBResponse {
  status: boolean;
  message?: string;
  data?: VisaRequestData[];
}

const visaRequestRepository = () => {
  /**
   * Get visa request by ID
   */
  const getById = async (id: number): Promise<GetVisaRequestDataDBResponse> => {
    try {
      const query = `
        SELECT 
          id,
          visa_country,
          visa_category,
          nationality,
          state,
          entry_type,
          remarks,
          last_updated_by,
          created_at,
          updated_at
        FROM ${constants.TABLES.VISA_REQUESTS}
        WHERE id = ?
      `;

      const result = await MySql.query<VisaRequestData[]>(query, [id]);
      return {
        status: result.status,
        data: result.data || [],
        message: result.status ? undefined : "Unable to fetch visa request details."
      };
    } catch (e) {
      logger.error(`Error in visaRequestRepository.getById: ${generateError(e)}`);
      return {
        status: false,
        message: "Unable to fetch visa request details."
      };
    }
  };

  /**
   * Get visa requests by IDs
   */
  const getByIds = async (ids: number[]): Promise<GetVisaRequestDataDBResponse> => {
    try {
      if (ids.length === 0) {
        return {
          status: true,
          data: []
        };
      }

      const query = `
        SELECT 
          id,
          visa_country,
          visa_category,
          nationality,
          state,
          entry_type,
          remarks,
          last_updated_by,
          created_at,
          updated_at
        FROM ${constants.TABLES.VISA_REQUESTS}
        WHERE id IN (?)
      `;

      const result = await MySql.query<VisaRequestData[]>(query, [ids]);
      return {
        status: result.status,
        data: result.data || [],
        message: result.status ? undefined : "Unable to fetch visa request details."
      };
    } catch (e) {
      logger.error(`Error in visaRequestRepository.getByIds: ${generateError(e)}`);
      return {
        status: false,
        message: "Unable to fetch visa request details."
      };
    }
  };

  /**
   * Insert a new visa request
   */
  const insert = async (visaRequestData: VisaRequestData): Promise<Response> => {
    const response = new Response(false);

    try {
      const query = `
        INSERT INTO ${constants.TABLES.VISA_REQUESTS} 
        (visa_country, visa_category, nationality, state, entry_type, remarks, last_updated_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        visaRequestData.visa_country,
        visaRequestData.visa_category,
        visaRequestData.nationality,
        visaRequestData.state,
        visaRequestData.entry_type,
        visaRequestData.remarks || '',
        visaRequestData.last_updated_by
      ];

      const result = await MySql.query(query, params);
      
      response.setStatus(result.status);
      if (result.status && result.data) {
        response.data = { insertId: result.data.insertId };
      } else {
        response.setMessage("Unable to create visa request.");
      }
      return response;
    } catch (e) {
      logger.error(`Error in visaRequestRepository.insert: ${generateError(e)}`);
      response.setMessage("Unable to create visa request.");
      return response;
    }
  };

  /**
   * Insert a visa request with existing connection (for transactions)
   * @deprecated Use insert() instead as we're moving away from connection-based functions
   */
  const insertWithConnection = async (visaRequestData: VisaRequestData): Promise<Response> => {
    // This function is deprecated, redirecting to the standard insert method
    return insert(visaRequestData);
  };

  /**
   * Batch insert multiple visa requests
   */
  const batchInsert = async (visaRequestsData: VisaRequestData[]): Promise<Response> => {
    const response = new Response(false);

    try {
      if (visaRequestsData.length === 0) {
        response.setStatus(true);
        response.data = { insertIds: [] };
        return response;
      }

      // Use query method directly with simple inserts
      const query = `
        INSERT INTO ${constants.TABLES.VISA_REQUESTS} 
        (visa_country, visa_category, nationality, state, entry_type, remarks, last_updated_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const insertIds = [];
      let firstInsertId = null;
      
      // Process each visa request with an individual insert
      for (const request of visaRequestsData) {
        const params = [
          request.visa_country,
          request.visa_category,
          request.nationality,
          request.state,
          request.entry_type,
          request.remarks || '',
          request.last_updated_by
        ];
        
        const result = await MySql.query(query, params);
        
        if (result.status && result.data) {
          const insertId = result.data.insertId;
          
          if (firstInsertId === null) {
            firstInsertId = insertId;
          }
          
          insertIds.push(insertId);
        }
      }
      
      response.setStatus(true);
      response.data = { 
        insertId: firstInsertId || 0,
        insertIds: insertIds,
        affectedRows: insertIds.length 
      };
      
      return response;
    } catch (e) {
      logger.error(`Error in visaRequestRepository.batchInsert: ${generateError(e)}`);
      response.setMessage("Unable to create visa requests in batch.");
      return response;
    }
  };

  return {
    getById,
    getByIds,
    insert,
    insertWithConnection,
    batchInsert
  };
};

export default visaRequestRepository; 