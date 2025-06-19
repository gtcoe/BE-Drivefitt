import constants from "../config/constants/constants";
import { generateError } from "../services/util";
import { logger } from "../logging";
import Mysql from "../database/mySql";

export interface ApplicationPassengerMappingData {
  id?: number;
  application_id?: number;
  passenger_id?: number;
  last_updated_by?: number;
  status?: number;
}

export interface GetApplicationPassengerMappingDataDBResponse {
  status: boolean;
  data: ApplicationPassengerMappingData[] | null;
}

const applicationPassengerMappingRepository = () => {
  //Done
  const insert = async (
    data: ApplicationPassengerMappingData
  ): Promise<any> => {
    try {
      const query = `INSERT INTO ${constants.TABLES.APPLICATION_PASSENGER_MAPPING} 
                (application_id,  passenger_id, last_updated_by, status) 
                VALUES (?, ?, ?, ?)`;
      const params = [
        data.application_id,
        data.passenger_id,
        data.last_updated_by,
        data.status
      ];
      const resp = await Mysql.query(query, params);

      if (resp.data?.insertId) {
        insertHistory(resp.data.insertId);
      }
      return resp;
    } catch (e) {
      logger.error(`Error in applicationPassengerMappingRepository.insert: ${generateError(e)}`);
      throw e;
    }
  };

  //Done
  const insertHistory = async (mappingId: number): Promise<void> => {
    try {
      const query = `INSERT INTO ${constants.TABLES.APPLICATION_PASSENGER_MAPPING_HISTORY} 
                (mapping_id, application_id,  passenger_id, last_updated_by, status) 
                SELECT id, application_id,  passenger_id, last_updated_by, status  
                FROM ${constants.TABLES.APPLICATION_PASSENGER_MAPPING} WHERE id = ?`;
      await Mysql.query(query, [mappingId]);
    } catch (e) {
      logger.error(`Error in applicationPassengerMappingRepository.insertHistory: ${generateError(e)}`);
      throw e;
    }
  };

  //Done
  const getByApplicationIds = async (
    application_ids: number[],
    status: number[]
  ): Promise<GetApplicationPassengerMappingDataDBResponse> => {
    try {
      const query = `SELECT * FROM ${constants.TABLES.APPLICATION_PASSENGER_MAPPING} WHERE application_id in (?) AND status in (?)`;
      return await Mysql.query<ApplicationPassengerMappingData[]>(query, [application_ids, status]);
    } catch (e) {
      logger.error(`Error in applicationPassengerMappingRepository.getByApplicationIds: ${generateError(e)}`);
      throw e;
    }
  };

   //Done
   const updateStatus = async (
    status: number,
    passengerId: number,
    applicationId: number,
    lastUpdatedBy: number
  ): Promise<any> => {
    try {
      const query = `UPDATE ${constants.TABLES.APPLICATION_PASSENGER_MAPPING} 
                SET status = ?, last_updated_by = ? 
                WHERE application_id = ? AND passenger_id = ?`;
      const params = [status, lastUpdatedBy, applicationId, passengerId];
      const resp = await Mysql.query(query, params);
      return resp;
    } catch (e) {
      logger.error(`Error in applicationPassengerMappingRepository.updateStatus: ${generateError(e)}`);
      throw e;
    }
  };

  /**
   * Create a mapping between an application and a passenger
   */
  const createMapping = async (
    applicationId: number | undefined,
    passengerId: number,
    lastUpdatedBy: number,
    connection?: any
  ): Promise<any> => {
    try {
      if (!applicationId) {
        throw new Error("Application ID is required for creating mapping");
      }
      
      const data: ApplicationPassengerMappingData = {
        application_id: applicationId,
        passenger_id: passengerId,
        last_updated_by: lastUpdatedBy,
        status: constants.STATUS.APPLICATION_PASSENGER_MAPPING.ACTIVE
      };
      
      const query = `INSERT INTO ${constants.TABLES.APPLICATION_PASSENGER_MAPPING} 
                (application_id, passenger_id, last_updated_by, status) 
                VALUES (?, ?, ?, ?)`;
      const params = [
        data.application_id,
        data.passenger_id,
        data.last_updated_by,
        data.status
      ];

      let resp;
      if (connection) {
        resp = await connection.query(query, params);
      } else {
        resp = await Mysql.query(query, params);
      }
      
      if (resp.data?.insertId) {
        // if (connection) {
        //    insertHistoryWithConnection(resp.data.insertId, connection);
        // } else {
        //    insertHistory(resp.data.insertId);
        // }
      }
      
      return resp;
    } catch (e) {
      logger.error(`Error in applicationPassengerMappingRepository.createMapping: ${generateError(e)}`);
      throw e;
    }
  };
  
  /**
   * Create batch mappings between applications and a passenger
   */
  const batchCreateMappings = async (
    applicationIds: number[],
    passengerId: number,
    lastUpdatedBy: number,
    connection: any
  ): Promise<any> => {
    try {
      if (applicationIds.length === 0) {
        return { status: true, data: null };
      }
      
      const query = `
        INSERT INTO ${constants.TABLES.APPLICATION_PASSENGER_MAPPING} 
        (application_id, passenger_id, last_updated_by, status)
        VALUES ?`;
      
      // Create values array for batch insert
      const values = applicationIds.map(appId => [
        appId, 
        passengerId,
        lastUpdatedBy,
        constants.STATUS.APPLICATION_PASSENGER_MAPPING.ACTIVE
      ]);
      
      const result = await connection.query(query, [values]);
      
      // Create history records for each mapping
      // if (result.data?.insertId) {
      //   const firstInsertId = result.data.insertId;
      //   for (let i = 0; i < applicationIds.length; i++) {
      //     await insertHistoryWithConnection(firstInsertId + i, connection);
      //   }
      // }
      
      return result;
    } catch (e) {
      logger.error(`Error in applicationPassengerMappingRepository.batchCreateMappings: ${generateError(e)}`);
      throw e;
    }
  };
  
  /**
   * Insert mapping history with connection
   */
  // const insertHistoryWithConnection = async (
  //   mappingId: number,
  //   connection: any
  // ): Promise<void> => {
  //   try {
  //     const dateTimeNow = moment().format('YYYY-MM-DD HH:mm:ss');
  //     const getMappingData = await connection.query(
  //       `SELECT * FROM ${constants.TABLES.APPLICATION_PASSENGER_MAPPING} WHERE id = ?`, [mappingId]
  //     );
  //     if (getMappingData.data.length > 0) {
  //       const mappingData = getMappingData.data[0];
  //       const historyQuery = `INSERT INTO ${constants.TABLES.APPLICATION_PASSENGER_MAPPING_HISTORY} SET ?`;
  //       await connection.query(historyQuery, {...mappingData, application_passenger_mapping_id: mappingId, created_at: dateTimeNow});
  //     }
  //   } catch (e) {
  //     logger.error(`Error in insertHistoryWithConnection: ${generateError(e)}`);
  //     throw e;
  //   }
  // };

  return {
    insert,
    insertHistory,
    getByApplicationIds,
    createMapping,
    batchCreateMappings,
    updateStatus
  };
};

export default applicationPassengerMappingRepository;
