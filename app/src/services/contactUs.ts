import { logger } from "../logging";
import { generateError } from "../services/util";
import constants from "../config/constants/drivefitt-constants";
import cacheService from "../services/cacheService";
import Response from "../models/response";
import ContactUsRepositoryFactory from "../repositories/contactUs";
import { 
  ContactUsSearchFilters, 
  ContactUsListResponse 
} from "../models/ContactUs/contactUs";

const ContactUsService = () => {
  const contactUsRepository = ContactUsRepositoryFactory();
  const moduleKey = "CONTACT_US_LIST";

  const getContactUsEntries = async (
    page: number = constants.PAGINATION.DEFAULT_PAGE,
    limit: number = constants.PAGINATION.DEFAULT_LIMIT,
    filters: ContactUsSearchFilters = {}
  ): Promise<Response> => {
    const response = new Response(false);

    try {
      if (page < 1) page = constants.PAGINATION.DEFAULT_PAGE;
      if (limit < 1 || limit > constants.PAGINATION.MAX_LIMIT) {
        limit = constants.PAGINATION.DEFAULT_LIMIT;
      }

      const cacheParams = { page, limit, filters };

      const cachedData = cacheService.getListCache<ContactUsListResponse>(moduleKey, cacheParams);
      if (cachedData) {
        response.setStatus(true);
        response.setData("contactUs", cachedData.contactUs);
        response.setData("pagination", {
          total: cachedData.total,
          page: cachedData.page,
          limit: cachedData.limit,
          totalPages: cachedData.totalPages,
        });
        response.setMessage(constants.SUCCESS_MESSAGES.FETCHED);
        return response;
      }

      const [contactUsResult, countResult] = await Promise.all([
        contactUsRepository.getContactUsEntries(page, limit, filters),
        contactUsRepository.getContactUsCount(filters)
      ]);

      if (!contactUsResult.status) {
        response.setStatusCode(500);
        response.setMessage(contactUsResult.message || constants.ERROR_MESSAGES.SERVER_ERROR);
        return response;
      }

      if (!countResult.status) {
        response.setStatusCode(500);
        response.setMessage(countResult.message || constants.ERROR_MESSAGES.SERVER_ERROR);
        return response;
      }

      const contactUs = contactUsResult.data || [];
      const total = countResult.data?.count || 0;
      const totalPages = Math.ceil(total / limit);

      const responseData: ContactUsListResponse = {
        contactUs,
        total,
        page,
        limit,
        totalPages,
      };

      cacheService.setListCache(moduleKey, cacheParams, responseData, constants.CACHE_TTL.MEDIUM);

      response.setStatus(true);
      response.setData("contactUs", contactUs);
      response.setData("pagination", {
        total,
        page,
        limit,
        totalPages,
      });
      response.setMessage(constants.SUCCESS_MESSAGES.FETCHED);
      return response;

    } catch (error) {
      logger.error(`Error in ContactUsService.getContactUsEntries: ${generateError(error)}`);
      response.setStatusCode(500);
      response.setMessage(constants.ERROR_MESSAGES.SERVER_ERROR);
      return response;
    }
  };

  const exportContactUsData = async (filters: ContactUsSearchFilters = {}): Promise<Response> => {
    const response = new Response(false);

    try {
      const result = await contactUsRepository.getAllContactUsForExport(filters);

      if (!result.status) {
        response.setStatusCode(500);
        response.setMessage(result.message || constants.ERROR_MESSAGES.SERVER_ERROR);
        return response;
      }

      response.setStatus(true);
      response.setData("contactUs", result.data || []);
      response.setMessage("Data ready for export");
      return response;

    } catch (error) {
      logger.error(`Error in ContactUsService.exportContactUsData: ${generateError(error)}`);
      response.setStatusCode(500);
      response.setMessage(constants.ERROR_MESSAGES.SERVER_ERROR);
      return response;
    }
  };

  return {
    getContactUsEntries,
    exportContactUsData,
  };
};

export default ContactUsService; 