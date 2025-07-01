import MySql from "../database/mySql";
import { logger } from "../logging";
import { generateError } from "../services/util";
import constants from "../config/constants/drivefitt-constants";
import { Career, CreateCareerRequest, UpdateCareerRequest, CareerSearchFilters } from "../models/Career/career";

export interface CareerDBResponse {
  status: boolean;
  data?: Career[] | null;
  message?: string;
}

export interface SingleCareerDBResponse {
  status: boolean;
  data?: Career | null;
  message?: string;
}

export interface CountDBResponse {
  status: boolean;
  data?: { count: number } | null;
  message?: string;
}

const CareerRepository = () => {
  const tableName = constants.TABLES.CAREERS;

  const getCareers = async (
    page: number = 1,
    limit: number = 10,
    filters: CareerSearchFilters = {}
  ): Promise<CareerDBResponse> => {
    try {
      const offset = (page - 1) * limit;
      let whereClause = "WHERE 1=1";
      const params: any[] = [];

      if (filters.status) {
        whereClause += " AND status = ?";
        params.push(filters.status);
      }

      if (filters.location) {
        whereClause += " AND location LIKE ?";
        params.push(`%${filters.location}%`);
      }

      if (filters.job_type) {
        whereClause += " AND job_type = ?";
        params.push(filters.job_type);
      }

      if (filters.experience_level) {
        whereClause += " AND experience_level = ?";
        params.push(filters.experience_level);
      }

      if (filters.posted_by) {
        whereClause += " AND posted_by = ?";
        params.push(filters.posted_by);
      }

      if (filters.search) {
        whereClause += " AND (title LIKE ? OR description LIKE ?)";
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      const sql = `
        SELECT * FROM ${tableName} 
        ${whereClause} 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      params.push(limit, offset);
      
      const result = await MySql.query<Career[]>(sql, params);
      return result;
    } catch (error) {
      logger.error(`Error in CareerRepository.getCareers: ${generateError(error)}`);
      return { status: false, message: "Failed to fetch careers" };
    }
  };

  const getCareersCount = async (filters: CareerSearchFilters = {}): Promise<CountDBResponse> => {
    try {
      let whereClause = "WHERE 1=1";
      const params: any[] = [];

      if (filters.status) {
        whereClause += " AND status = ?";
        params.push(filters.status);
      }

      if (filters.location) {
        whereClause += " AND location LIKE ?";
        params.push(`%${filters.location}%`);
      }

      if (filters.job_type) {
        whereClause += " AND job_type = ?";
        params.push(filters.job_type);
      }

      if (filters.experience_level) {
        whereClause += " AND experience_level = ?";
        params.push(filters.experience_level);
      }

      if (filters.posted_by) {
        whereClause += " AND posted_by = ?";
        params.push(filters.posted_by);
      }

      if (filters.search) {
        whereClause += " AND (title LIKE ? OR description LIKE ?)";
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      const sql = `SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`;
      const result = await MySql.query<{ count: number }[]>(sql, params);
      
      if (result.status && result.data && result.data.length > 0) {
        return { status: true, data: result.data[0] };
      }
      
      return { status: false, message: "Failed to get count" };
    } catch (error) {
      logger.error(`Error in CareerRepository.getCareersCount: ${generateError(error)}`);
      return { status: false, message: "Failed to get careers count" };
    }
  };

  const getCareerById = async (id: number): Promise<SingleCareerDBResponse> => {
    try {
      const sql = `SELECT * FROM ${tableName} WHERE id = ?`;
      const result = await MySql.query<Career[]>(sql, [id]);
      
      if (result.status && result.data && result.data.length > 0) {
        return { status: true, data: result.data[0] };
      }
      
      return { status: false, message: "Career not found" };
    } catch (error) {
      logger.error(`Error in CareerRepository.getCareerById: ${generateError(error)}`);
      return { status: false, message: "Failed to fetch career" };
    }
  };

  const createCareer = async (careerData: CreateCareerRequest, adminId: number): Promise<SingleCareerDBResponse> => {
    try {
      const sql = `
        INSERT INTO ${tableName} 
        (title, description, location, job_type, experience_level, salary_range, 
         requirements, responsibilities, benefits, status, posted_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        careerData.title,
        careerData.description,
        careerData.location,
        careerData.job_type,
        careerData.experience_level,
        careerData.salary_range || null,
        careerData.requirements,
        careerData.responsibilities,
        careerData.benefits || null,
        careerData.status || constants.STATUS.CAREER.ACTIVE,
        adminId
      ];

      const result = await MySql.query(sql, params);
      
      if (result.status && result.data && typeof result.data === 'object' && 'insertId' in result.data) {
        return await getCareerById(result.data.insertId);
      }
      
      return { status: false, message: "Failed to create career" };
    } catch (error) {
      logger.error(`Error in CareerRepository.createCareer: ${generateError(error)}`);
      return { status: false, message: "Failed to create career" };
    }
  };

  const updateCareer = async (careerData: UpdateCareerRequest): Promise<SingleCareerDBResponse> => {
    try {
      const fields: string[] = [];
      const params: any[] = [];

      if (careerData.title !== undefined) {
        fields.push("title = ?");
        params.push(careerData.title);
      }
      if (careerData.description !== undefined) {
        fields.push("description = ?");
        params.push(careerData.description);
      }
      if (careerData.location !== undefined) {
        fields.push("location = ?");
        params.push(careerData.location);
      }
      if (careerData.job_type !== undefined) {
        fields.push("job_type = ?");
        params.push(careerData.job_type);
      }
      if (careerData.experience_level !== undefined) {
        fields.push("experience_level = ?");
        params.push(careerData.experience_level);
      }
      if (careerData.salary_range !== undefined) {
        fields.push("salary_range = ?");
        params.push(careerData.salary_range);
      }
      if (careerData.requirements !== undefined) {
        fields.push("requirements = ?");
        params.push(careerData.requirements);
      }
      if (careerData.responsibilities !== undefined) {
        fields.push("responsibilities = ?");
        params.push(careerData.responsibilities);
      }
      if (careerData.benefits !== undefined) {
        fields.push("benefits = ?");
        params.push(careerData.benefits);
      }
      if (careerData.status !== undefined) {
        fields.push("status = ?");
        params.push(careerData.status);
      }

      if (fields.length === 0) {
        return { status: false, message: "No fields to update" };
      }

      fields.push("updated_at = CURRENT_TIMESTAMP");
      params.push(careerData.id);

      const sql = `UPDATE ${tableName} SET ${fields.join(", ")} WHERE id = ?`;
      const result = await MySql.query(sql, params);
      
      if (result.status) {
        return await getCareerById(careerData.id);
      }
      
      return { status: false, message: "Failed to update career" };
    } catch (error) {
      logger.error(`Error in CareerRepository.updateCareer: ${generateError(error)}`);
      return { status: false, message: "Failed to update career" };
    }
  };

  const deleteCareer = async (id: number): Promise<{ status: boolean; message?: string }> => {
    try {
      const sql = `DELETE FROM ${tableName} WHERE id = ?`;
      const result = await MySql.query(sql, [id]);
      
      if (result.status) {
        return { status: true };
      }
      
      return { status: false, message: "Failed to delete career" };
    } catch (error) {
      logger.error(`Error in CareerRepository.deleteCareer: ${generateError(error)}`);
      return { status: false, message: "Failed to delete career" };
    }
  };

  return {
    getCareers,
    getCareersCount,
    getCareerById,
    createCareer,
    updateCareer,
    deleteCareer,
  };
};

export default CareerRepository; 