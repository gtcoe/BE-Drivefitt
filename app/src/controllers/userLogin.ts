import { Request, Response } from "express";
import { logger } from "../logging";
import UserLoginService from "../services/userLogin";
import { generateError } from "../services/util";
import ResponseModel from "../models/response";
import { UserLoginSearchFilters } from "../models/UserLogin/userLogin";

const userLoginService = UserLoginService();

const UserLoginController = () => {
  const getUserLogins = async (req: Request, res: Response): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const filters: UserLoginSearchFilters = {
        email: req.query.email as string,
        device_type: req.query.device_type as string,
        platform: req.query.platform as string,
        search: req.query.search as string,
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
      };

      Object.keys(filters).forEach(key => 
        filters[key as keyof UserLoginSearchFilters] === undefined && 
        delete filters[key as keyof UserLoginSearchFilters]
      );

      const result = await userLoginService.getUserLogins(page, limit, filters);
      res.status(result.statusCode).send(result);
    } catch (e) {
      logger.error(`Error in UserLoginController.getUserLogins: ${generateError(e)}`);
      response.setStatusCode(500);
      response.setMessage("Internal Server Error");
      res.status(500).send(response);
    }
  };

  const exportUserLoginData = async (req: Request, res: Response): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const filters: UserLoginSearchFilters = {
        email: req.query.email as string,
        device_type: req.query.device_type as string,
        platform: req.query.platform as string,
        search: req.query.search as string,
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
      };

      Object.keys(filters).forEach(key => 
        filters[key as keyof UserLoginSearchFilters] === undefined && 
        delete filters[key as keyof UserLoginSearchFilters]
      );

      const result = await userLoginService.exportUserLoginData(filters);
      res.status(result.statusCode).send(result);
    } catch (e) {
      logger.error(`Error in UserLoginController.exportUserLoginData: ${generateError(e)}`);
      response.setStatusCode(500);
      response.setMessage("Internal Server Error");
      res.status(500).send(response);
    }
  };

  return {
    getUserLogins,
    exportUserLoginData,
  };
};

export default UserLoginController(); 