import { Request, Response } from "express";
import { logger } from "../logging";
import AdminAuthService from "../services/adminAuth";
import { generateError } from "../services/util";
import ResponseModel from "../models/response";

const adminAuthService = AdminAuthService();

const AdminAuthController = () => {
  const signIn = async (req: Request, res: Response): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        response.setStatusCode(400);
        response.setMessage("Email and password are required.");
        res.status(400).send(response);
        return;
      }

      const result = await adminAuthService.signIn({ email, password });
      res.status(result.statusCode).send(result);
    } catch (e) {
      logger.error(`Error in AdminAuthController.signIn: ${generateError(e)}`);
      response.setStatusCode(500);
      response.setMessage("Internal Server Error");
      res.status(500).send(response);
    }
  };

  const changePassword = async (req: Request, res: Response): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const { current_password, new_password } = req.body;
      const adminId = req.body.token_user_id; // From auth middleware

      if (!current_password || !new_password) {
        response.setStatusCode(400);
        response.setMessage("Current password and new password are required.");
        res.status(400).send(response);
        return;
      }

      if (new_password.length < 6) {
        response.setStatusCode(400);
        response.setMessage("New password must be at least 6 characters long.");
        res.status(400).send(response);
        return;
      }

      const result = await adminAuthService.changePassword(adminId, current_password, new_password);
      res.status(result.statusCode).send(result);
    } catch (e) {
      logger.error(`Error in AdminAuthController.changePassword: ${generateError(e)}`);
      response.setStatusCode(500);
      response.setMessage("Internal Server Error");
      res.status(500).send(response);
    }
  };

  return {
    signIn,
    changePassword,
  };
};

export default AdminAuthController(); 