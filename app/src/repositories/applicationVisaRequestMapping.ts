import MySql from "../database/mySql";
import Response from "../models/response";
import { logger } from "../logging";
import { generateError } from "../services/util";
import constants from "../config/constants/constants";

export interface ApplicationVisaRequestMappingData {
  id?: number;
  application_id: number;
  visa_request_id: number;
  status: number;
  last_updated_by: number;
  created_at?: string;
  updated_at?: string;
}

export interface GetApplicationVisaRequestMappingDBResponse {
  status: boolean;
  message?: string;
  data?: ApplicationVisaRequestMappingData[];
}

const applicationVisaRequestMappingRepository = () => {
  /**
   * Get mappings by application ID
   */
  const getByApplicationId = async (applicationId: number): Promise<GetApplicationVisaRequestMappingDBResponse> => {
    try {
      const query = `
        SELECT 
          id,
          application_id,
          visa_request_id,
          last_updated_by,
          created_at,
          updated_at
        FROM application_visa_request_mapping
        WHERE application_id = ? and status = ? 
      `;

      const result = await MySql.query<ApplicationVisaRequestMappingData[]>(query, [applicationId, constants.STATUS.APPLICATION_VISA_REQUEST_MAPPING.ACTIVE]);
      return {
        status: result.status,
        data: result.data || [],
        message: result.status ? undefined : "Unable to fetch application-visa request mappings."
      };
    } catch (e) {
      logger.error(`Error in applicationVisaRequestMappingRepository.getByApplicationId: ${generateError(e)}`);
      return {
        status: false,
        message: "Unable to fetch application-visa request mappings."
      };
    }
  };

  /**
   * Get mappings by application IDs
   */
  const getByApplicationIds = async (applicationIds: number[]): Promise<GetApplicationVisaRequestMappingDBResponse> => {
    try {
      if (applicationIds.length === 0) {
        return {
          status: true,
          data: []
        };
      }

      const query = `
        SELECT 
          id,
          application_id,
          visa_request_id,
          last_updated_by,
          created_at,
          updated_at
        FROM application_visa_request_mapping
        WHERE application_id IN (?) and status = ? 
      `;

      const result = await MySql.query<ApplicationVisaRequestMappingData[]>(query, [applicationIds, constants.STATUS.APPLICATION_VISA_REQUEST_MAPPING.ACTIVE]);
      
      return {
        status: result.status,
        data: result.data || [],
        message: result.status ? undefined : "Unable to fetch application-visa request mappings."
      };
    } catch (e) {
      logger.error(`Error in applicationVisaRequestMappingRepository.getByApplicationIds: ${generateError(e)}`);
      return {
        status: false,
        message: "Unable to fetch application-visa request mappings."
      };
    }
  };

  /**
   * Get mappings by visa request ID
   */
  const getByVisaRequestId = async (visaRequestId: number): Promise<GetApplicationVisaRequestMappingDBResponse> => {
    try {
      const query = `
        SELECT 
          id,
          application_id,
          visa_request_id,
          last_updated_by,
          created_at,
          updated_at
        FROM application_visa_request_mapping
        WHERE visa_request_id = ? and status = ? 
      `;

      const result = await MySql.query<ApplicationVisaRequestMappingData[]>(query, [visaRequestId, constants.STATUS.APPLICATION_VISA_REQUEST_MAPPING.ACTIVE]);
      
      return {
        status: result.status,
        data: result.data || [],
        message: result.status ? undefined : "Unable to fetch application-visa request mappings."
      };
    } catch (e) {
      logger.error(`Error in applicationVisaRequestMappingRepository.getByVisaRequestId: ${generateError(e)}`);
      return {
        status: false,
        message: "Unable to fetch application-visa request mappings."
      };
    }
  };

  /**
   * Create a mapping between application and visa request
   */
  const createMapping = async (
    applicationId: number,
    visaRequestId: number,
    lastUpdatedBy: number
  ): Promise<Response> => {
    const response = new Response(false);

    try {
      const query = `
        INSERT INTO application_visa_request_mapping 
        (application_id, visa_request_id, last_updated_by, status) 
        VALUES (?, ?, ?, ?)
      `;

      const result = await MySql.query(query, [applicationId, visaRequestId, lastUpdatedBy, constants.STATUS.APPLICATION_VISA_REQUEST_MAPPING.ACTIVE]);
      
      response.setStatus(result.status);
      if (result.status && result.data) {
        response.data = { insertId: result.data.insertId };
      } else {
        response.setMessage("Unable to create application-visa request mapping.");
      }
      return response;
    } catch (e) {
      logger.error(`Error in applicationVisaRequestMappingRepository.createMapping: ${generateError(e)}`);
      response.setMessage("Unable to create application-visa request mapping.");
      return response;
    }
  };

  /**
   * Batch create mappings
   */
  const batchCreateMappings = async (
    applicationIds: number[],
    visaRequestIds: number[],
    lastUpdatedBy: number
  ): Promise<Response> => {
    const response = new Response(false);

    try {
      if (applicationIds.length === 0 || visaRequestIds.length === 0) {
        response.setStatus(true);
        response.data = { insertIds: [] };
        return response;
      }

      // Use query method directly with simple inserts
      const query = `
        INSERT INTO application_visa_request_mapping 
        (application_id, visa_request_id, last_updated_by, status) 
        VALUES (?, ?, ?, ?)
      `;

      // Prepare mapping combinations based on the input arrays
      const mappingsToCreate = [];
      
      // Create mappings based on the length of arrays
      if (visaRequestIds.length === applicationIds.length) {
        // If equal length, create one-to-one mappings
        for (let i = 0; i < applicationIds.length; i++) {
          mappingsToCreate.push([applicationIds[i], visaRequestIds[i], lastUpdatedBy, constants.STATUS.APPLICATION_VISA_REQUEST_MAPPING.ACTIVE]);
        }
      } else if (visaRequestIds.length === 1) {
        // If only one visa request, map it to all applications
        for (const appId of applicationIds) {
          mappingsToCreate.push([appId, visaRequestIds[0], lastUpdatedBy, constants.STATUS.APPLICATION_VISA_REQUEST_MAPPING.ACTIVE]);
        }
      } else if (applicationIds.length === 1) {
        // If only one application, map all visa requests to it
        for (const visaId of visaRequestIds) {
          mappingsToCreate.push([applicationIds[0], visaId, lastUpdatedBy, constants.STATUS.APPLICATION_VISA_REQUEST_MAPPING.ACTIVE]);
        }
      } else {
        // For other cases, create a cartesian product (each app with each visa)
        for (const appId of applicationIds) {
          for (const visaId of visaRequestIds) {
            mappingsToCreate.push([appId, visaId, lastUpdatedBy, constants.STATUS.APPLICATION_VISA_REQUEST_MAPPING.ACTIVE]);
          }
        }
      }

      if (mappingsToCreate.length === 0) {
        response.setStatus(true);
        response.data = { insertIds: [] };
        return response;
      }

      // Execute individual inserts
      const insertIds = [];
      let firstInsertId = null;
      
      for (const [appId, visaId, updatedBy] of mappingsToCreate) {
        // Use direct MySQL query
        const result = await MySql.query(query, [appId, visaId, updatedBy]);
        
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
      logger.error(`Error in applicationVisaRequestMappingRepository.batchCreateMappings: ${generateError(e)}`);
      response.setMessage("Unable to create application-visa request mappings in batch.");
      return response;
    }
  };

  /**
   * Update the status of visa request mappings by their IDs
   */
  const updateStatusByIds = async (
    mappingIds: number[],
    status: number,
    lastUpdatedBy: number
  ): Promise<Response> => {
    const response = new Response(false);

    try {
      if (mappingIds.length === 0) {
        response.setStatus(true);
        response.data = { affectedRows: 0 };
        return response;
      }

      const query = `
        UPDATE application_visa_request_mapping 
        SET status = ?, last_updated_by = ?, updated_at = NOW()
        WHERE id IN (${mappingIds.join(',')})
      `;

      const result = await MySql.query(query, [status, lastUpdatedBy]);
      
      response.setStatus(result.status);
      if (result.status && result.data) {
        response.data = { 
          affectedRows: result.data.affectedRows || 0
        };
      } else {
        response.setMessage("Unable to update application-visa request mapping status.");
      }
      return response;
    } catch (e) {
      logger.error(`Error in applicationVisaRequestMappingRepository.updateStatusByIds: ${generateError(e)}`);
      response.setMessage("Unable to update application-visa request mapping status.");
      return response;
    }
  };

  return {
    getByApplicationId,
    getByApplicationIds,
    getByVisaRequestId,
    createMapping,
    batchCreateMappings,
    updateStatusByIds
  };
};

export default applicationVisaRequestMappingRepository; 