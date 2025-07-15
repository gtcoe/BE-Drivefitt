import { logger } from "../logging";
import { generateError } from "../services/util";
import constants from "../config/constants/drivefitt-constants";
import cacheService from "../services/cacheService";
import Response from "../models/response";
import FranchiseRepositoryFactory from "../repositories/franchise";
import {
  FranchiseSearchFilters,
  FranchiseListResponse,
} from "../models/Franchise/franchise";

const FranchiseService = () => {
  const franchiseRepository = FranchiseRepositoryFactory();
  const moduleKey = "FRANCHISE_LIST";

  const getFranchiseInquiries = async (
    page: number = constants.PAGINATION.DEFAULT_PAGE,
    limit: number = constants.PAGINATION.DEFAULT_LIMIT,
    filters: FranchiseSearchFilters = {}
  ): Promise<Response> => {
    const response = new Response(false);

    try {
      if (page < 1) page = constants.PAGINATION.DEFAULT_PAGE;
      if (limit < 1 || limit > constants.PAGINATION.MAX_LIMIT) {
        limit = constants.PAGINATION.DEFAULT_LIMIT;
      }

      const cacheParams = { page, limit, filters };

      const cachedData = cacheService.getListCache<FranchiseListResponse>(
        moduleKey,
        cacheParams
      );
      if (cachedData) {
        response.setStatus(true);
        response.setData("franchiseInquiries", cachedData.franchiseInquiries);
        response.setData("pagination", {
          total: cachedData.total,
          page: cachedData.page,
          limit: cachedData.limit,
          totalPages: cachedData.totalPages,
        });
        response.setMessage(constants.SUCCESS_MESSAGES.FETCHED);
        return response;
      }

      const [franchiseResult, countResult] = await Promise.all([
        franchiseRepository.getFranchiseInquiries(page, limit, filters),
        franchiseRepository.getFranchiseCount(filters),
      ]);

      if (!franchiseResult.status) {
        response.setStatusCode(500);
        response.setMessage(
          franchiseResult.message || constants.ERROR_MESSAGES.SERVER_ERROR
        );
        return response;
      }

      if (!countResult.status) {
        response.setStatusCode(500);
        response.setMessage(
          countResult.message || constants.ERROR_MESSAGES.SERVER_ERROR
        );
        return response;
      }

      const franchiseInquiries = franchiseResult.data || [];
      const total = countResult.data?.count || 0;
      const totalPages = Math.ceil(total / limit);

      const responseData: FranchiseListResponse = {
        franchiseInquiries,
        total,
        page,
        limit,
        totalPages,
      };

      cacheService.setListCache(
        moduleKey,
        cacheParams,
        responseData,
        constants.CACHE_TTL.MEDIUM
      );

      response.setStatus(true);
      response.setData("franchiseInquiries", franchiseInquiries);
      response.setData("pagination", {
        total,
        page,
        limit,
        totalPages,
      });
      response.setMessage(constants.SUCCESS_MESSAGES.FETCHED);
      return response;
    } catch (error) {
      logger.error(
        `Error in FranchiseService.getFranchiseInquiries: ${generateError(
          error
        )}`
      );
      response.setStatusCode(500);
      response.setMessage(constants.ERROR_MESSAGES.SERVER_ERROR);
      return response;
    }
  };

  const exportFranchiseData = async (
    filters: FranchiseSearchFilters = {}
  ): Promise<Response> => {
    const response = new Response(false);

    try {
      const result = await franchiseRepository.getAllFranchiseForExport(
        filters
      );

      if (!result.status) {
        response.setStatusCode(500);
        response.setMessage(
          result.message || constants.ERROR_MESSAGES.SERVER_ERROR
        );
        return response;
      }

      response.setStatus(true);
      response.setData("franchiseInquiries", result.data || []);
      response.setMessage("Data ready for export");
      return response;
    } catch (error) {
      logger.error(
        `Error in FranchiseService.exportFranchiseData: ${generateError(error)}`
      );
      response.setStatusCode(500);
      response.setMessage(constants.ERROR_MESSAGES.SERVER_ERROR);
      return response;
    }
  };

  const createFranchiseInquiry = async (franchiseData: {
    contact_person: string;
    email: string;
    phone: string;
    city: string;
    message: string;
    status: number;
  }): Promise<Response> => {
    const response = new Response(false);

    try {
      const result = await franchiseRepository.createFranchiseInquiry(
        franchiseData
      );

      if (!result.status) {
        response.setStatusCode(500);
        response.setMessage(
          result.message || constants.ERROR_MESSAGES.SERVER_ERROR
        );
        return response;
      }

      // Clear cache after creating new entry
      cacheService.invalidateModuleCache(moduleKey);

      response.setStatus(true);
      response.setStatusCode(201);
      response.setData("franchise", result.data);
      response.setMessage("Franchise inquiry submitted successfully");
      return response;
    } catch (error) {
      logger.error(
        `Error in FranchiseService.createFranchiseInquiry: ${generateError(
          error
        )}`
      );
      response.setStatusCode(500);
      response.setMessage(constants.ERROR_MESSAGES.SERVER_ERROR);
      return response;
    }
  };

  return {
    getFranchiseInquiries,
    exportFranchiseData,
    createFranchiseInquiry,
  };
};

export default FranchiseService;
