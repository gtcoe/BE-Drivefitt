import { Request, Response } from "express";
import { logger } from "../logging";
import PaymentService from "../services/payment";
import { generateError } from "../services/util";
import ResponseModel from "../models/response";
import { PaymentSearchFilters } from "../models/Payment/payment";

const paymentService = PaymentService();

const PaymentController = () => {
  const getPayments = async (req: Request, res: Response): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const filters: PaymentSearchFilters = {
        user_email: req.query.user_email as string,
        transaction_id: req.query.transaction_id as string,
        status: req.query.status as string,
        payment_method: req.query.payment_method as string,
        min_amount: req.query.min_amount ? parseFloat(req.query.min_amount as string) : undefined,
        max_amount: req.query.max_amount ? parseFloat(req.query.max_amount as string) : undefined,
        search: req.query.search as string,
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
      };

      Object.keys(filters).forEach(key => 
        filters[key as keyof PaymentSearchFilters] === undefined && 
        delete filters[key as keyof PaymentSearchFilters]
      );

      const result = await paymentService.getPayments(page, limit, filters);
      res.status(result.statusCode).send(result);
    } catch (e) {
      logger.error(`Error in PaymentController.getPayments: ${generateError(e)}`);
      response.setStatusCode(500);
      response.setMessage("Internal Server Error");
      res.status(500).send(response);
    }
  };

  const exportPaymentData = async (req: Request, res: Response): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const filters: PaymentSearchFilters = {
        user_email: req.query.user_email as string,
        transaction_id: req.query.transaction_id as string,
        status: req.query.status as string,
        payment_method: req.query.payment_method as string,
        min_amount: req.query.min_amount ? parseFloat(req.query.min_amount as string) : undefined,
        max_amount: req.query.max_amount ? parseFloat(req.query.max_amount as string) : undefined,
        search: req.query.search as string,
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
      };

      Object.keys(filters).forEach(key => 
        filters[key as keyof PaymentSearchFilters] === undefined && 
        delete filters[key as keyof PaymentSearchFilters]
      );

      const result = await paymentService.exportPaymentData(filters);
      res.status(result.statusCode).send(result);
    } catch (e) {
      logger.error(`Error in PaymentController.exportPaymentData: ${generateError(e)}`);
      response.setStatusCode(500);
      response.setMessage("Internal Server Error");
      res.status(500).send(response);
    }
  };

  return {
    getPayments,
    exportPaymentData,
  };
};

export default PaymentController(); 