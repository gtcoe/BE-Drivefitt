import { Request, Response } from "express";
import { logger } from "../logging";
import FranchiseService from "../services/franchise";
import { generateError } from "../services/util";
import ResponseModel from "../models/response";
import { FranchiseSearchFilters } from "../models/Franchise/franchise";

const franchiseService = FranchiseService();

const FranchiseController = () => {
  const getFranchiseInquiries = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const filters: FranchiseSearchFilters = {
        status: req.query.status
          ? parseInt(req.query.status as string)
          : undefined,
        assigned_to: req.query.assigned_to
          ? parseInt(req.query.assigned_to as string)
          : undefined,
        city: req.query.city as string,
        state: req.query.state as string,
        search: req.query.search as string,
        date_from: req.query.date_from as string,
        date_to: req.query.date_to as string,
        investment_capacity_min: req.query.investment_capacity_min
          ? parseFloat(req.query.investment_capacity_min as string)
          : undefined,
        investment_capacity_max: req.query.investment_capacity_max
          ? parseFloat(req.query.investment_capacity_max as string)
          : undefined,
      };

      Object.keys(filters).forEach(
        (key) =>
          filters[key as keyof FranchiseSearchFilters] === undefined &&
          delete filters[key as keyof FranchiseSearchFilters]
      );

      const result = await franchiseService.getFranchiseInquiries(
        page,
        limit,
        filters
      );
      res.status(result.statusCode).send(result);
    } catch (e) {
      logger.error(
        `Error in FranchiseController.getFranchiseInquiries: ${generateError(
          e
        )}`
      );
      response.setStatusCode(500);
      response.setMessage("Internal Server Error");
      res.status(500).send(response);
    }
  };

  const exportFranchiseData = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const filters: FranchiseSearchFilters = {
        status: req.query.status
          ? parseInt(req.query.status as string)
          : undefined,
        assigned_to: req.query.assigned_to
          ? parseInt(req.query.assigned_to as string)
          : undefined,
        city: req.query.city as string,
        state: req.query.state as string,
        search: req.query.search as string,
        date_from: req.query.date_from as string,
        date_to: req.query.date_to as string,
        investment_capacity_min: req.query.investment_capacity_min
          ? parseFloat(req.query.investment_capacity_min as string)
          : undefined,
        investment_capacity_max: req.query.investment_capacity_max
          ? parseFloat(req.query.investment_capacity_max as string)
          : undefined,
      };

      Object.keys(filters).forEach(
        (key) =>
          filters[key as keyof FranchiseSearchFilters] === undefined &&
          delete filters[key as keyof FranchiseSearchFilters]
      );

      const result = await franchiseService.exportFranchiseData(filters);
      res.status(result.statusCode).send(result);
    } catch (e) {
      logger.error(
        `Error in FranchiseController.exportFranchiseData: ${generateError(e)}`
      );
      response.setStatusCode(500);
      response.setMessage("Internal Server Error");
      res.status(500).send(response);
    }
  };

  const createFranchiseInquiry = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const {
        fullName,
        emailAddress,
        phoneNumber,
        proposedCity,
        additionalMessage,
      } = req.body;

      // Validate required fields
      if (!fullName || !emailAddress || !phoneNumber || !proposedCity) {
        response.setStatusCode(400);
        response.setMessage(
          "Full name, email, phone number and city are required"
        );
        res.status(400).send(response);
        return;
      }

      const franchiseData = {
        contact_person: fullName,
        email: emailAddress,
        phone: phoneNumber,
        city: proposedCity,
        message: additionalMessage || "",
        status: 1, // New inquiry
      };

      const result = await franchiseService.createFranchiseInquiry(
        franchiseData
      );
      res.status(result.statusCode).send(result);
    } catch (e) {
      logger.error(
        `Error in FranchiseController.createFranchiseInquiry: ${generateError(
          e
        )}`
      );
      response.setStatusCode(500);
      response.setMessage("Internal Server Error");
      res.status(500).send(response);
    }
  };

  return {
    getFranchiseInquiries,
    exportFranchiseData,
    createFranchiseInquiry,
  };
};

export default FranchiseController();
