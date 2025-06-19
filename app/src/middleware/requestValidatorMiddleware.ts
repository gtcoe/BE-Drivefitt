import { Request, NextFunction, RequestHandler } from "express";
import httpRequestValidator, {
  ErrorResponse,
} from "../services/httpRequestValidator";
import ResponseModel from "../models/response";
import errors from "../config/errors";

// Define the expected structure for the validation fields
interface ValidationFields {
  query?: Record<string, any>;
  params?: Record<string, any>;
  body?: Record<string, any>;
}

// Middleware function to validate request parameters
const requestValidator = (fields: ValidationFields): RequestHandler => {
  return (req: any, res: any, next: NextFunction): void => {
    const response = new ResponseModel(false);
    const validationErrors: ErrorResponse[] = [];
    console.log("===>fields", fields);
    console.log("===>req", req.params);
    // Validate query, params, and body if provided
    Object.entries(fields).forEach(([key, rules]) => {
      if (rules && typeof rules === "object" && Object.keys(rules).length) {
        validationErrors.push(
          ...httpRequestValidator.init(req[key as keyof Request], rules)
        );
      }
    });

    // Return error response if validation fails
    if (validationErrors.length) {
      response.setMessage(errors.INVALID_REQUEST);
      response.setData("error", validationErrors);
      res.status(400).json(response);
      return;
    }

    next();
  };
};

export default requestValidator;
