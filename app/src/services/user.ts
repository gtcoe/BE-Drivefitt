import moment from "moment";
import bcrypt from "bcrypt";

import constants from "../config/constants/constants";
import { logger } from "../logging";
import Response from "../models/response";
import { generateError, generateRandomString } from "../services/util";
import userRepositoryFactory, {
  UserData,
  GetUserDataDBResponse,
} from "../repositories/user";
import { AddUserRequest } from "../models/User/addUserRequest";
import { UpdateUserStatusRequest } from "../models/User/updateUserStatusRequest";
import emailService from "../services/email";

const userService = () => {
  const userRepository = userRepositoryFactory();

  //Done
  const getAll = async (): Promise<Response | void> => {
    const response = new Response(false);
    try {
      const userResponse: GetUserDataDBResponse = await userRepository.getAll();

      // Error Fetching userInfo
      if (!userResponse || !userResponse.status) {
        throw new Error("unable to fetch user info");
      }

      response.setStatus(true);
      response.setData("users_info", userResponse.data);
      return response;
    } catch (e) {
      logger.error(`error in userService.get - ${generateError(e)}`);
      throw e;
    }
  };

  //Done
  const getById = async (userId: number): Promise<Response | void> => {
    const response = new Response(false);
    try {
      if (!userId) {
        // If ID is missing, send an error response.
        response.setStatusCode(400);
        response.setMessage("User ID is required.");
        return;
      }

      const userResponse: GetUserDataDBResponse = await userRepository.getByID(
        userId
      );

      // Error Fetching userInfo
      if (!userResponse || !userResponse.status) {
        throw new Error("unable to fetch user info by userID");
      }

      const userInfo = userResponse.data ? userResponse.data[0] : null
      const userResponseData = {
        id: userInfo?.id,
        name: userInfo?.name,
        email: userInfo?.email,
        status: userInfo?.status,
        type: userInfo?.type,
      }
      response.setStatus(true);
      response.setData(
        "user_info",
        userResponseData
      );
      return response;
    } catch (e) {
      logger.error(`error in userService.get - ${generateError(e)}`);
      throw e;
    }
  };

  const fetchClients = async (
    email: string,
    pageNo: number,
    pageSize: number = 10
  ): Promise<UserData[] | null> => {
    try {
      // Fetch user info using email
      const userResponse: GetUserDataDBResponse =
        await userRepository.getUsersByType(
          constants.USER_TABLE.TYPE.CLIENT,
          email,
          pageNo,
          pageSize
        );

      // Error Fetching userInfo
      if (!userResponse || !userResponse.status) {
        throw new Error("unable to fetch user info");
      }

      return userResponse.data;
    } catch (e) {
      logger.error(`error in userService.fetchClients - ${generateError(e)}`);
      throw e;
    }
  };

  //Done
  const addUser = async (request: AddUserRequest): Promise<any> => {
    const response = new Response(false);
    try {
      // Fetch user info using email
      const userResponse: GetUserDataDBResponse | null =
        await userRepository.getUserByEmail(request.email);

      // Error Fetching userInfo
      if (!userResponse || !userResponse.status) {
        throw new Error("Unable to fetch user info");
      }

      // User with this email already exists
      if ((userResponse?.data || []).length > 0) {
        response.setMessage("User with same email already exists.");
        return response;
      }

      // Generate a random password.
      const password = generateRandomString(12);
      request.password = bcrypt.hashSync(password, 15);
      request.password_valid_till = moment(new Date())
        .add(30, "days")
        .format("YYYY-MM-DD HH:mm:ss");
      request.status = constants.STATUS.USER.ACTIVE;

      // Create User
      const resp: any = await userRepository.insertUser(request);
      if (!resp.status) {
        throw new Error("Unable to create user");
      }
      logger.info(`email_send_initiated`);
      const emailSvc = emailService();
      emailSvc.sendEmail({
        type: constants.EMAIL_TYPE.CREDENTIALS,
        data: {
          fullName: request.name,
          email: request.email,
          password: password,
          URL: constants.LOGIN_URL
        },
        emails: [request.email]
      });

      response.setStatus(true);
      response.setMessage("User created successfully.");
      return response;
    } catch (e) {
      logger.error(`error in userService.addUser - ${generateError(e)}`);
      throw e;
    }
  };

  //Done
  const updateStatus = async (
    request: UpdateUserStatusRequest
  ): Promise<any> => {
    const response = new Response(false);
    try {
      const userResponse: GetUserDataDBResponse | null =
        await userRepository.getByID(request.user_id);

      // Error Fetching userInfo
      if (!userResponse || !userResponse.status) {
        throw new Error("Unable to fetch user info");
      }

      // User with this email already exists
      if ((userResponse.data || []).length == 0) {
        response.setMessage("User with this ID does not exists.");
        return response;
      }

      const userInfo = (userResponse.data || [])[0];

      if (userInfo.status === request.status) {
        response.setStatusCode(400);
        response.setMessage("Status already updated.");
        return response;
      }

      if (request.status === constants.STATUS.USER.ACTIVE) {
        const password = generateRandomString(12);
        const encryptedPassword = bcrypt.hashSync(password, 15);

        const resp: any = await userRepository.updateStatusAndPassword(
          request.status,
          encryptedPassword,
          request.user_id,
          request.last_updated_by
        );

        if (!resp.status) {
          throw new Error("Unable to update user status");
        }

        const emailSvc = emailService();
        emailSvc.sendEmail({
          type: constants.EMAIL_TYPE.CREDENTIALS,
          data: {
            fullName: userInfo.name,
            email: userInfo.email,
            password: password,
            URL: constants.LOGIN_URL
          },
          emails: [userInfo.email]
        });

        // todo send email
      } else if (request.status === constants.STATUS.USER.INACTIVE) {
        const resp: any = await userRepository.updateStatus(
          request.status,
          request.user_id,
          request.last_updated_by
        );
        if (!resp.status) {
          throw new Error("Unable to update user status");
        }
      }

      response.setStatus(true);
      response.setMessage("User status updated successfully.");
      return response;
    } catch (e) {
      logger.error(`error in userService.updateStatus - ${generateError(e)}`);
      throw e;
    }
  };

  //Done
  const search = async (text: string): Promise<any> => {
    const response = new Response(false);
    try {
      const userResponse: GetUserDataDBResponse = await userRepository.search(
        text
      );

      // Error Fetching userInfo
      if (!userResponse || !userResponse.status) {
        throw new Error("unable to fetch user info");
      }

      response.setStatus(true);
      response.setData("users_info", userResponse.data);
      return response;
    } catch (e) {
      logger.error(`error in userService.search - ${generateError(e)}`);
      throw e;
    }
  };

  return {
    getAll,
    getById,
    fetchClients,
    updateStatus,
    addUser,
    search,
  };
};

export default userService;
