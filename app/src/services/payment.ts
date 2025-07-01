import { logger } from "../logging";
import { generateError } from "../services/util";
import constants from "../config/constants/drivefitt-constants";
import cacheService from "../services/cacheService";
import Response from "../models/response";
import PaymentRepositoryFactory from "../repositories/payment";
import { 
  Payment, 
  PaymentSearchFilters, 
  PaymentListResponse 
} from "../models/Payment/payment";

const PaymentService = () => {
  const paymentRepository = PaymentRepositoryFactory();
  const moduleKey = "PAYMENTS_LIST";

  const getPayments = async (
    page: number = constants.PAGINATION.DEFAULT_PAGE,
    limit: number = constants.PAGINATION.DEFAULT_LIMIT,
    filters: PaymentSearchFilters = {}
  ): Promise<Response> => {
    const response = new Response(false);

    try {
      if (page < 1) page = constants.PAGINATION.DEFAULT_PAGE;
      if (limit < 1 || limit > constants.PAGINATION.MAX_LIMIT) {
        limit = constants.PAGINATION.DEFAULT_LIMIT;
      }

      const cacheParams = { page, limit, filters };

      const cachedData = cacheService.getListCache<PaymentListResponse>(moduleKey, cacheParams);
      if (cachedData) {
        response.setStatus(true);
        response.setData("payments", cachedData.payments);
        response.setData("pagination", {
          total: cachedData.total,
          page: cachedData.page,
          limit: cachedData.limit,
          totalPages: cachedData.totalPages,
        });
        response.setMessage(constants.SUCCESS_MESSAGES.FETCHED);
        return response;
      }

      const [paymentsResult, countResult] = await Promise.all([
        paymentRepository.getPayments(page, limit, filters),
        paymentRepository.getPaymentsCount(filters)
      ]);

      if (!paymentsResult.status) {
        response.setStatusCode(500);
        response.setMessage(paymentsResult.message || constants.ERROR_MESSAGES.SERVER_ERROR);
        return response;
      }

      if (!countResult.status) {
        response.setStatusCode(500);
        response.setMessage(countResult.message || constants.ERROR_MESSAGES.SERVER_ERROR);
        return response;
      }

      const payments = paymentsResult.data || [];
      const total = countResult.data?.count || 0;
      const totalPages = Math.ceil(total / limit);

      const responseData: PaymentListResponse = {
        payments,
        total,
        page,
        limit,
        totalPages,
      };

      cacheService.setListCache(moduleKey, cacheParams, responseData, constants.CACHE_TTL.MEDIUM);

      response.setStatus(true);
      response.setData("payments", payments);
      response.setData("pagination", {
        total,
        page,
        limit,
        totalPages,
      });
      response.setMessage(constants.SUCCESS_MESSAGES.FETCHED);
      return response;

    } catch (error) {
      logger.error(`Error in PaymentService.getPayments: ${generateError(error)}`);
      response.setStatusCode(500);
      response.setMessage(constants.ERROR_MESSAGES.SERVER_ERROR);
      return response;
    }
  };

  const exportPaymentData = async (filters: PaymentSearchFilters = {}): Promise<Response> => {
    const response = new Response(false);

    try {
      const result = await paymentRepository.getAllPaymentsForExport(filters);

      if (!result.status) {
        response.setStatusCode(500);
        response.setMessage(result.message || constants.ERROR_MESSAGES.SERVER_ERROR);
        return response;
      }

      response.setStatus(true);
      response.setData("payments", result.data || []);
      response.setMessage("Data ready for export");
      return response;

    } catch (error) {
      logger.error(`Error in PaymentService.exportPaymentData: ${generateError(error)}`);
      response.setStatusCode(500);
      response.setMessage(constants.ERROR_MESSAGES.SERVER_ERROR);
      return response;
    }
  };

  return {
    getPayments,
    exportPaymentData,
  };
};

export default PaymentService; 