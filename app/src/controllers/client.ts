import { Request, Response } from "express";
import { logger } from "../logging";
import ClientService from "../services/client";
import { generateError } from "../services/util";
import ResponseModel from "../models/response";
import {
  AddClientRequest,
  convertRequestToAddClientRequest,
} from "../models/Client/addClientRequest";

const clientService = ClientService();

const ClientController = () => {
  const getAll = async (_: Request, res: Response): Promise<void> => {
    try {
      const resp = await clientService.getAll();
      res.send(resp);
    } catch (e: any) {
      const response = new ResponseModel(false);
      logger.error(`Error in ClientController.get: ${generateError(e)}`);
      response.message = "Internal Server Error";
      res.status(500).send(response);
    }
  };

  const create = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: AddClientRequest = convertRequestToAddClientRequest(
        req.body
      );

      const resp = await clientService.create(request);
      res.send(resp);
    } catch (e: any) {
      const response = new ResponseModel(false);
      logger.error(`Error in create: ${generateError(e)}`);
      response.message = "Internal Server Error";
      res.status(500).send(response);
    }
  };

  const getByType = async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      if (!type) {
        res.status(400).send({
          status: false,
          message: "Type is required as path parameter",
        });
        return;
      }
      const clientType = parseInt(type);
      
      const resp = await clientService.getClientsByType(clientType);
      res.send(resp);
    } catch (e) {
      const response = new ResponseModel(false);
      logger.error(`Error in ClientController.getByType: ${generateError(e)}`);
      response.message = "Internal Server Error";
      res.status(500).send(response);
    }
  };

  const search = async (req: Request, res: Response): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const { text } = req.body;

      if (!text) {
        response.message = "Search text is required.";
        res.status(400).send(response);
        return;
      }

      const resp = await clientService.search(text);
      res.send(resp);
    } catch (e: any) {
      logger.error(`Error in ClientController.search: ${generateError(e)}`);
      response.message = "Internal Server Error";
      res.status(500).send(response);
    }
  };

  const getByClientId = async (req: Request, res: Response) => {
    try {
      const { client_id } = req.params;
      if (!client_id) {
        res.status(400).send({
          status: false,
          message: "Client User ID is required as path parameter",
        });
        return;
      }
      
      const clientId = parseInt(client_id);
      const resp = await clientService.getClientById(clientId);
      res.send(resp);
    } catch (e) {
      const response = new ResponseModel(false);
      logger.error(`Error in ClientController.getByClientId: ${generateError(e)}`);
      response.message = "Internal Server Error";
      res.status(500).send(response);
    }
  };

  return {
    getAll,
    create,
    getByType,
    search,
    getByClientId
  };
};

export default ClientController();
