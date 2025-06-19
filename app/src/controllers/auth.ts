import { Request, Response } from "express";
import { logger } from "../logging";
import AuthService from "../services/auth";
import { generateError } from "../services/util";
import ResponseModel from "../models/response";

// Create a single instance of AuthService to reuse across functions
const authService = AuthService();

const AuthController = () => {
  /**
   * Handles user sign-in.
   */
  const signIn = async (req: Request, res: Response): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        response.message = "Email and password are required.";
        res.status(400).send(response);
        return;
      }

      // Call service method for signing in
      const resp = await authService.signIn({ email, password });
      res.send(resp);
    } catch (e) {
      logger.error(`Error in AuthController.signIn: ${generateError(e)}`);
      response.message = "Internal Server Error";
      res.status(500).send(response);
    }
  };

  /**
   * Handles new password requests.
   */
  const requestNewPassword = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const { email } = req.body;

      if (!email) {
        response.message = "Email is required.";
        res.status(400).send(response);
        return;
      }

      // Call service method to request new password
      const resp = await authService.requestNewPassword(email);
      res.send(resp);
    } catch (e) {
      logger.error(
        `Error in AuthController.requestNewPassword: ${generateError(e)}`
      );
      response.message = "Internal Server Error";
      res.status(500).send(response);
    }
  };

  /**
   * Generates a JWT token for the provided user ID.
   */
  // const generateToken = (userId: number): string => {
  //   return jwt.sign({ id: userId }, config.jwtSecret, {
  //     algorithm: "HS256",
  //     expiresIn: "24h",
  //   });
  // };

  return {
    signIn,
    requestNewPassword,
    // generateToken,
  };
};

export default AuthController();
