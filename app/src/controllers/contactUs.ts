import { Request, Response } from "express";
import { logger } from "../logging";
import ContactUsService from "../services/contactUs";
import { generateError } from "../services/util";
import ResponseModel from "../models/response";
import { ContactUsSearchFilters } from "../models/ContactUs/contactUs";

const contactUsService = ContactUsService();

const ContactUsController = () => {
  const getContactUsEntries = async (req: Request, res: Response): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const filters: ContactUsSearchFilters = {
        first_name: req.query.first_name as string,
        last_name: req.query.last_name as string,
        email: req.query.email as string,
        phone: req.query.phone as string,
        search: req.query.search as string,
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
      };

      Object.keys(filters).forEach(key => 
        filters[key as keyof ContactUsSearchFilters] === undefined && 
        delete filters[key as keyof ContactUsSearchFilters]
      );

      const result = await contactUsService.getContactUsEntries(page, limit, filters);
      res.status(result.statusCode).send(result);
    } catch (e) {
      logger.error(`Error in ContactUsController.getContactUsEntries: ${generateError(e)}`);
      response.setStatusCode(500);
      response.setMessage("Internal Server Error");
      res.status(500).send(response);
    }
  };

  const exportContactUsData = async (req: Request, res: Response): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const filters: ContactUsSearchFilters = {
        first_name: req.query.first_name as string,
        last_name: req.query.last_name as string,
        email: req.query.email as string,
        phone: req.query.phone as string,
        search: req.query.search as string,
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
      };

      Object.keys(filters).forEach(key => 
        filters[key as keyof ContactUsSearchFilters] === undefined && 
        delete filters[key as keyof ContactUsSearchFilters]
      );

      const result = await contactUsService.exportContactUsData(filters);
      res.status(result.statusCode).send(result);
    } catch (e) {
      logger.error(`Error in ContactUsController.exportContactUsData: ${generateError(e)}`);
      response.setStatusCode(500);
      response.setMessage("Internal Server Error");
      res.status(500).send(response);
    }
  };

  const createContactUs = async (req: Request, res: Response): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const { firstName, lastName, email, phone, message } = req.body;

      // Validate required fields
      if (!firstName || !phone) {
        response.setStatusCode(400);
        response.setMessage("First name and phone are required");
        res.status(400).send(response);
        return;
      }

      const contactUsData = {
        first_name: firstName,
        last_name: lastName || '',
        email: email || '',
        phone: phone,
        message: message || ''
      };

      const result = await contactUsService.createContactUs(contactUsData);
      res.status(result.statusCode).send(result);
    } catch (e) {
      logger.error(`Error in ContactUsController.createContactUs: ${generateError(e)}`);
      response.setStatusCode(500);
      response.setMessage("Internal Server Error");
      res.status(500).send(response);
    }
  };

  return {
    getContactUsEntries,
    exportContactUsData,
    createContactUs,
  };
};

export default ContactUsController(); 