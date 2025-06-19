import { Request, Response } from "express";
import { logger } from "../logging";
import EmailService from "../services/email";
import { generateError } from "../services/util";
import ResponseModel from "../models/response";
import {
  SendEmailRequest,
  convertRequestToSendEmailRequest
} from "../models/Email/sendEmailRequest";

const emailService = EmailService();

const EmailController = () => {
  const sendEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: SendEmailRequest = convertRequestToSendEmailRequest(req.body);
      
      const resp = await emailService.sendEmail(request);
      res.send(resp);
    } catch (e: any) {
      const response = new ResponseModel(false);
      logger.error(`Error in sendEmail: ${generateError(e)}`);
      response.message = "Internal Server Error";
      res.status(500).send(response);
    }
  };

  return {
    sendEmail
  };
};

export default EmailController(); 