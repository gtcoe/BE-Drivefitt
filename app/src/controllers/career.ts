import { Request, Response } from "express";
import { logger } from "../logging";
import CareerService from "../services/career";
import { generateError } from "../services/util";
import ResponseModel from "../models/response";
import { CreateCareerRequest, UpdateCareerRequest, CareerSearchFilters } from "../models/Career/career";

const careerService = CareerService();

const CareerController = () => {
  /**
   * Get all careers with pagination and search
   */
  const getCareers = async (req: Request, res: Response): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const filters: CareerSearchFilters = {
        status: req.query.status ? parseInt(req.query.status as string) : undefined,
        location: req.query.location as string,
        job_type: req.query.job_type as string,
        experience_level: req.query.experience_level as string,
        posted_by: req.query.posted_by ? parseInt(req.query.posted_by as string) : undefined,
        search: req.query.search as string,
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => 
        filters[key as keyof CareerSearchFilters] === undefined && 
        delete filters[key as keyof CareerSearchFilters]
      );

      const result = await careerService.getCareers(page, limit, filters);
      res.status(result.statusCode).send(result);
    } catch (e) {
      logger.error(`Error in CareerController.getCareers: ${generateError(e)}`);
      response.setStatusCode(500);
      response.setMessage("Internal Server Error");
      res.status(500).send(response);
    }
  };

  /**
   * Get career by ID
   */
  const getCareerById = async (req: Request, res: Response): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const id = parseInt(req.params.id);
      
      if (!id || isNaN(id)) {
        response.setStatusCode(400);
        response.setMessage("Invalid career ID");
        res.status(400).send(response);
        return;
      }

      const result = await careerService.getCareerById(id);
      res.status(result.statusCode).send(result);
    } catch (e) {
      logger.error(`Error in CareerController.getCareerById: ${generateError(e)}`);
      response.setStatusCode(500);
      response.setMessage("Internal Server Error");
      res.status(500).send(response);
    }
  };

  /**
   * Create new career
   */
  const createCareer = async (req: Request, res: Response): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const careerData: CreateCareerRequest = {
        title: req.body.title,
        description: req.body.description,
        location: req.body.location,
        job_type: req.body.job_type,
        experience_level: req.body.experience_level,
        salary_range: req.body.salary_range,
        requirements: req.body.requirements,
        responsibilities: req.body.responsibilities,
        benefits: req.body.benefits,
        status: req.body.status,
      };

      // Validate required fields
      if (!careerData.title || !careerData.description || !careerData.location || 
          !careerData.job_type || !careerData.experience_level || 
          !careerData.requirements || !careerData.responsibilities) {
        response.setStatusCode(400);
        response.setMessage("Missing required fields");
        res.status(400).send(response);
        return;
      }

      const adminId = req.body.token_user_id; // From auth middleware
      const result = await careerService.createCareer(careerData, adminId);
      res.status(result.statusCode).send(result);
    } catch (e) {
      logger.error(`Error in CareerController.createCareer: ${generateError(e)}`);
      response.setStatusCode(500);
      response.setMessage("Internal Server Error");
      res.status(500).send(response);
    }
  };

  /**
   * Update career
   */
  const updateCareer = async (req: Request, res: Response): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const id = parseInt(req.params.id);
      
      if (!id || isNaN(id)) {
        response.setStatusCode(400);
        response.setMessage("Invalid career ID");
        res.status(400).send(response);
        return;
      }

      const careerData: UpdateCareerRequest = {
        id,
        title: req.body.title,
        description: req.body.description,
        location: req.body.location,
        job_type: req.body.job_type,
        experience_level: req.body.experience_level,
        salary_range: req.body.salary_range,
        requirements: req.body.requirements,
        responsibilities: req.body.responsibilities,
        benefits: req.body.benefits,
        status: req.body.status,
      };

      // Remove undefined values
      Object.keys(careerData).forEach(key => 
        careerData[key as keyof UpdateCareerRequest] === undefined && 
        delete careerData[key as keyof UpdateCareerRequest]
      );

      const result = await careerService.updateCareer(careerData);
      res.status(result.statusCode).send(result);
    } catch (e) {
      logger.error(`Error in CareerController.updateCareer: ${generateError(e)}`);
      response.setStatusCode(500);
      response.setMessage("Internal Server Error");
      res.status(500).send(response);
    }
  };

  /**
   * Delete career
   */
  const deleteCareer = async (req: Request, res: Response): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const id = parseInt(req.params.id);
      
      if (!id || isNaN(id)) {
        response.setStatusCode(400);
        response.setMessage("Invalid career ID");
        res.status(400).send(response);
        return;
      }

      const result = await careerService.deleteCareer(id);
      res.status(result.statusCode).send(result);
    } catch (e) {
      logger.error(`Error in CareerController.deleteCareer: ${generateError(e)}`);
      response.setStatusCode(500);
      response.setMessage("Internal Server Error");
      res.status(500).send(response);
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

export default CareerController(); 