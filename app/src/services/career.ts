import { logger } from "../logging";
import { generateError } from "../services/util";
import constants from "../config/constants/drivefitt-constants";
import cacheService from "../services/cacheService";
import Response from "../models/response";
import CareerRepositoryFactory from "../repositories/career";
import { 
  Career, 
  CreateCareerRequest, 
  UpdateCareerRequest, 
  CareerSearchFilters, 
  CareerListResponse 
} from "../models/Career/career";

const CareerService = () => {
  const careerRepository = CareerRepositoryFactory();
  const moduleKey = "CAREERS_LIST";

  /**
   * Get careers with pagination, search, and caching
   */
  const getCareers = async (
    page: number = constants.PAGINATION.DEFAULT_PAGE,
    limit: number = constants.PAGINATION.DEFAULT_LIMIT,
    filters: CareerSearchFilters = {}
  ): Promise<Response> => {
    const response = new Response(false);

    try {
      // Validate pagination
      if (page < 1) page = constants.PAGINATION.DEFAULT_PAGE;
      if (limit < 1 || limit > constants.PAGINATION.MAX_LIMIT) {
        limit = constants.PAGINATION.DEFAULT_LIMIT;
      }

      const cacheParams = { page, limit, filters };

      // Try to get from cache first
      const cachedData = cacheService.getListCache<CareerListResponse>(moduleKey, cacheParams);
      if (cachedData) {
        response.setStatus(true);
        response.setData("careers", cachedData.careers);
        response.setData("pagination", {
          total: cachedData.total,
          page: cachedData.page,
          limit: cachedData.limit,
          totalPages: cachedData.totalPages,
        });
        response.setMessage(constants.SUCCESS_MESSAGES.FETCHED);
        return response;
      }

      // Get data from database
      const [careersResult, countResult] = await Promise.all([
        careerRepository.getCareers(page, limit, filters),
        careerRepository.getCareersCount(filters)
      ]);

      if (!careersResult.status) {
        response.setStatusCode(500);
        response.setMessage(careersResult.message || constants.ERROR_MESSAGES.SERVER_ERROR);
        return response;
      }

      if (!countResult.status) {
        response.setStatusCode(500);
        response.setMessage(countResult.message || constants.ERROR_MESSAGES.SERVER_ERROR);
        return response;
      }

      const careers = careersResult.data || [];
      const total = countResult.data?.count || 0;
      const totalPages = Math.ceil(total / limit);

      const responseData: CareerListResponse = {
        careers,
        total,
        page,
        limit,
        totalPages,
      };

      // Cache the result
      cacheService.setListCache(moduleKey, cacheParams, responseData, constants.CACHE_TTL.MEDIUM);

      response.setStatus(true);
      response.setData("careers", careers);
      response.setData("pagination", {
        total,
        page,
        limit,
        totalPages,
      });
      response.setMessage(constants.SUCCESS_MESSAGES.FETCHED);
      return response;

    } catch (error) {
      logger.error(`Error in CareerService.getCareers: ${generateError(error)}`);
      response.setStatusCode(500);
      response.setMessage(constants.ERROR_MESSAGES.SERVER_ERROR);
      return response;
    }
  };

  /**
   * Get career by ID with caching
   */
  const getCareerById = async (id: number): Promise<Response> => {
    const response = new Response(false);

    try {
      // Try cache first
      const cachedCareer = cacheService.getItemCache<Career>(moduleKey, id);
      if (cachedCareer) {
        response.setStatus(true);
        response.setData("career", cachedCareer);
        response.setMessage(constants.SUCCESS_MESSAGES.FETCHED);
        return response;
      }

      // Get from database
      const result = await careerRepository.getCareerById(id);

      if (!result.status) {
        response.setStatusCode(404);
        response.setMessage(result.message || constants.ERROR_MESSAGES.RESOURCE_NOT_FOUND);
        return response;
      }

      // Cache the result
      if (result.data) {
        cacheService.setItemCache(moduleKey, id, result.data, constants.CACHE_TTL.MEDIUM);
      }

      response.setStatus(true);
      response.setData("career", result.data);
      response.setMessage(constants.SUCCESS_MESSAGES.FETCHED);
      return response;

    } catch (error) {
      logger.error(`Error in CareerService.getCareerById: ${generateError(error)}`);
      response.setStatusCode(500);
      response.setMessage(constants.ERROR_MESSAGES.SERVER_ERROR);
      return response;
    }
  };

  /**
   * Create new career
   */
  const createCareer = async (careerData: CreateCareerRequest, adminId: number): Promise<Response> => {
    const response = new Response(false);

    try {
      // Validate required fields
      if (!careerData.title || !careerData.description || !careerData.location || 
          !careerData.requirements || !careerData.responsibilities) {
        response.setStatusCode(400);
        response.setMessage(constants.ERROR_MESSAGES.VALIDATION_ERROR);
        return response;
      }

      // Create career
      const result = await careerRepository.createCareer(careerData, adminId);

      if (!result.status) {
        response.setStatusCode(500);
        response.setMessage(result.message || constants.ERROR_MESSAGES.SERVER_ERROR);
        return response;
      }

      // Invalidate cache since new data is added
      cacheService.invalidateModuleCache(moduleKey);

      response.setStatus(true);
      response.setData("career", result.data);
      response.setMessage(constants.SUCCESS_MESSAGES.CREATED);
      return response;

    } catch (error) {
      logger.error(`Error in CareerService.createCareer: ${generateError(error)}`);
      response.setStatusCode(500);
      response.setMessage(constants.ERROR_MESSAGES.SERVER_ERROR);
      return response;
    }
  };

  /**
   * Update career
   */
  const updateCareer = async (careerData: UpdateCareerRequest): Promise<Response> => {
    const response = new Response(false);

    try {
      // Check if career exists
      const existingResult = await careerRepository.getCareerById(careerData.id);
      if (!existingResult.status) {
        response.setStatusCode(404);
        response.setMessage(constants.ERROR_MESSAGES.RESOURCE_NOT_FOUND);
        return response;
      }

      // Update career
      const result = await careerRepository.updateCareer(careerData);

      if (!result.status) {
        response.setStatusCode(500);
        response.setMessage(result.message || constants.ERROR_MESSAGES.SERVER_ERROR);
        return response;
      }

      // Invalidate cache
      cacheService.invalidateModuleCache(moduleKey);
      cacheService.deleteItemCache(moduleKey, careerData.id);

      response.setStatus(true);
      response.setData("career", result.data);
      response.setMessage(constants.SUCCESS_MESSAGES.UPDATED);
      return response;

    } catch (error) {
      logger.error(`Error in CareerService.updateCareer: ${generateError(error)}`);
      response.setStatusCode(500);
      response.setMessage(constants.ERROR_MESSAGES.SERVER_ERROR);
      return response;
    }
  };

  /**
   * Delete career
   */
  const deleteCareer = async (id: number): Promise<Response> => {
    const response = new Response(false);

    try {
      // Check if career exists
      const existingResult = await careerRepository.getCareerById(id);
      if (!existingResult.status) {
        response.setStatusCode(404);
        response.setMessage(constants.ERROR_MESSAGES.RESOURCE_NOT_FOUND);
        return response;
      }

      // Delete career
      const result = await careerRepository.deleteCareer(id);

      if (!result.status) {
        response.setStatusCode(500);
        response.setMessage(result.message || constants.ERROR_MESSAGES.SERVER_ERROR);
        return response;
      }

      // Invalidate cache
      cacheService.invalidateModuleCache(moduleKey);
      cacheService.deleteItemCache(moduleKey, id);

      response.setStatus(true);
      response.setMessage(constants.SUCCESS_MESSAGES.DELETED);
      return response;

    } catch (error) {
      logger.error(`Error in CareerService.deleteCareer: ${generateError(error)}`);
      response.setStatusCode(500);
      response.setMessage(constants.ERROR_MESSAGES.SERVER_ERROR);
      return response;
    }
  };

  return {
    getCareers,
    getCareerById,
    createCareer,
    updateCareer,
    deleteCareer,
  };
};

export default CareerService; 