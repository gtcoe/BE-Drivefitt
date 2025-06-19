import { Request, Response } from "express";
import { logger } from "../logging";
import UserService from "../services/user";
import { generateError } from "../services/util";
import ResponseModel from "../models/response";
import {
  AddUserRequest,
  convertRequestToAddUserRequest,
} from "../models/User/addUserRequest";
import {
  UpdateUserStatusRequest,
  convertRequestToUpdateUserStatusRequest,
} from "../models/User/updateUserStatusRequest";

const userService = UserService();

const UserController = () => {
  //Done
  const getAll = async (_: Request, res: Response): Promise<void> => {
    try {
      const resp = await userService.getAll();
      res.send(resp);
    } catch (e: any) {
      const response = new ResponseModel(false);
      logger.error(`Error in get: ${generateError(e)}`);
      response.message = "Internal Server Error";
      res.status(500).send(response);
    }
  };

  //Done
  const getById = async (req: Request, res: Response): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      if (!req.params.id) {
        response.message = "User ID is required.";
        res.status(400).send(response);
        return;
      }
      const resp = await userService.getById(Number(req.params.id));
      res.send(resp);
    } catch (e: any) {
      logger.error(`Error in getById: ${generateError(e)}`);
      response.message = "Internal Server Error";
      res.status(500).send(response);
    }
  };

  //Done
  const addUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: AddUserRequest = convertRequestToAddUserRequest(req.body);

      const resp = await userService.addUser(request);
      res.send(resp);
    } catch (e: any) {
      const response = new ResponseModel(false);
      logger.error(`Error in addUser: ${generateError(e)}`);
      response.message = "Internal Server Error";
      res.status(500).send(response);
    }
  };

  //Done
  const updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: UpdateUserStatusRequest =
        convertRequestToUpdateUserStatusRequest(req.body);

      const resp = await userService.updateStatus(request);
      res.send(resp);
    } catch (e: any) {
      const response = new ResponseModel(false);
      logger.error(`Error in updateStatus: ${generateError(e)}`);
      response.message = "Internal Server Error";
      res.status(500).send(response);
    }
  };

  //Done
  const search = async (req: Request, res: Response): Promise<void> => {
    const response = new ResponseModel(false);
    try {
      const { text } = req.body;

      if (!text) {
        response.message = "Search text is required.";
        res.status(400).send(response);
        return;
      }

      const resp = await userService.search(text);
      res.send(resp);
    } catch (e: any) {
      logger.error(`Error in search: ${generateError(e)}`);
      response.message = "Internal Server Error";
      res.status(500).send(response);
    }
  };

  return {
    getAll,
    getById,
    addUser,
    updateStatus,
    search,
  };
};

export default UserController();
