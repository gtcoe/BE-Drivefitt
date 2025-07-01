import { logger } from "../logging";
import { generateError } from "../services/util";
import constants from "../config/constants/drivefitt-constants";
import cacheService from "../services/cacheService";
import Response from "../models/response";
import UserLoginRepositoryFactory from "../repositories/userLogin";
import { 
  UserLoginSearchFilters, 
  UserLoginListResponse 
} from "../models/UserLogin/userLogin";

const UserLoginService = () => {
  const userLoginRepository = UserLoginRepositoryFactory();
  const moduleKey = "USER_LOGINS_LIST";

  const getUserLogins = async (
    page: number = constants.PAGINATION.DEFAULT_PAGE,
    limit: number = constants.PAGINATION.DEFAULT_LIMIT,
    filters: UserLoginSearchFilters = {}
  ): Promise<Response> => {
    const response = new Response(false);

    try {
      if (page < 1) page = constants.PAGINATION.DEFAULT_PAGE;
      if (limit < 1 || limit > constants.PAGINATION.MAX_LIMIT) {
        limit = constants.PAGINATION.DEFAULT_LIMIT;
      }

      const cacheParams = { page, limit, filters };

      const cachedData = cacheService.getListCache<UserLoginListResponse>(moduleKey, cacheParams);
      if (cachedData) {
        response.setStatus(true);
        response.setData("userLogins", cachedData.userLogins);
        response.setData("pagination", {
          total: cachedData.total,
          page: cachedData.page,
          limit: cachedData.limit,
          totalPages: cachedData.totalPages,
        });
        response.setMessage(constants.SUCCESS_MESSAGES.FETCHED);
        return response;
      }

      const [userLoginsResult, countResult] = await Promise.all([
        userLoginRepository.getUserLogins(page, limit, filters),
        userLoginRepository.getUserLoginsCount(filters)
      ]);

      if (!userLoginsResult.status) {
        response.setStatusCode(500);
        response.setMessage(userLoginsResult.message || constants.ERROR_MESSAGES.SERVER_ERROR);
        return response;
      }

      if (!countResult.status) {
        response.setStatusCode(500);
        response.setMessage(countResult.message || constants.ERROR_MESSAGES.SERVER_ERROR);
        return response;
      }

      const userLogins = userLoginsResult.data || [];
      const total = countResult.data?.count || 0;
      const totalPages = Math.ceil(total / limit);

      const responseData: UserLoginListResponse = {
        userLogins,
        total,
        page,
        limit,
        totalPages,
      };

      cacheService.setListCache(moduleKey, cacheParams, responseData, constants.CACHE_TTL.MEDIUM);

      response.setStatus(true);
      response.setData("userLogins", userLogins);
      response.setData("pagination", {
        total,
        page,
        limit,
        totalPages,
      });
      response.setMessage(constants.SUCCESS_MESSAGES.FETCHED);
      return response;

    } catch (error) {
      logger.error(`Error in UserLoginService.getUserLogins: ${generateError(error)}`);
      response.setStatusCode(500);
      response.setMessage(constants.ERROR_MESSAGES.SERVER_ERROR);
      return response;
    }
  };

  const exportUserLoginData = async (filters: UserLoginSearchFilters = {}): Promise<Response> => {
    const response = new Response(false);

    try {
      const result = await userLoginRepository.getAllUserLoginsForExport(filters);

      if (!result.status) {
        response.setStatusCode(500);
        response.setMessage(result.message || constants.ERROR_MESSAGES.SERVER_ERROR);
        return response;
      }

      response.setStatus(true);
      response.setData("userLogins", result.data || []);
      response.setMessage("Data ready for export");
      return response;

    } catch (error) {
      logger.error(`Error in UserLoginService.exportUserLoginData: ${generateError(error)}`);
      response.setStatusCode(500);
      response.setMessage(constants.ERROR_MESSAGES.SERVER_ERROR);
      return response;
    }
  };

  return {
    getUserLogins,
    exportUserLoginData,
  };
};

export default UserLoginService; 