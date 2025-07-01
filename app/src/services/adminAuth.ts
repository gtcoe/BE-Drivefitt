import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { logger } from "../logging";
import authConfig from "../config/auth";
import constants from "../config/constants/drivefitt-constants";
import { generateError } from "../services/util";
import Response from "../models/response";
import AdminRepositoryFactory from "../repositories/admin";
import { AdminLoginRequest } from "../models/Admin/admin";

const AdminAuthService = () => {
  const adminRepository = AdminRepositoryFactory();

  const signIn = async (request: AdminLoginRequest): Promise<Response> => {
    const response = new Response(false);

    try {
      // Fetch admin info using email
      const adminResponse = await adminRepository.getAdminByEmail(request.email);

      // Error fetching admin info
      if (!adminResponse || !adminResponse.status) {
        response.setStatusCode(400);
        response.setMessage(constants.SIGN_IN_STATUS_MESSAGE.EMAIL_NOT_FOUND);
        response.setData("login_status", constants.SIGN_IN_STATUS_TYPE.EMAIL_NOT_FOUND);
        return response;
      }

      const adminInfo = adminResponse.data;

      // Admin info not found
      if (!adminInfo) {
        response.setStatusCode(400);
        response.setMessage(constants.SIGN_IN_STATUS_MESSAGE.EMAIL_NOT_FOUND);
        response.setData("login_status", constants.SIGN_IN_STATUS_TYPE.EMAIL_NOT_FOUND);
        return response;
      }

      // Validate password
      const passwordIsValid = bcrypt.compareSync(request.password, adminInfo.password);
      if (!passwordIsValid) {
        response.setStatusCode(401);
        response.setMessage(constants.SIGN_IN_STATUS_MESSAGE.INCORRECT_PASSWORD);
        response.setData("login_status", constants.SIGN_IN_STATUS_TYPE.INCORRECT_PASSWORD);
        return response;
      }

      // Check if admin is active
      if (adminInfo.status !== constants.STATUS.ADMIN.ACTIVE) {
        response.setStatusCode(400);
        response.setMessage(constants.SIGN_IN_STATUS_MESSAGE.INACTIVE_BY_ADMIN);
        response.setData("login_status", constants.SIGN_IN_STATUS_TYPE.INACTIVE_BY_ADMIN);
        return response;
      }

      // Generate JWT token on successful authentication
      const token = jwt.sign(
        { 
          admin_id: adminInfo.id,
          email: adminInfo.email,
          name: adminInfo.name 
        }, 
        authConfig.jwtSecret,
        {
          algorithm: "HS256",
          allowInsecureKeySizes: true,
          expiresIn: 60 * 60 * 24 * 7, // 7 Days
        }
      );

      // Update last successful login timestamp
      await adminRepository.updateLastLogin(adminInfo.id);

      // Prepare response data without password
      const adminData = {
        id: adminInfo.id,
        email: adminInfo.email,
        phone: adminInfo.phone,
        name: adminInfo.name,
        status: adminInfo.status,
        last_login_at: adminInfo.last_login_at,
        created_at: adminInfo.created_at,
        updated_at: adminInfo.updated_at,
      };

      response.setStatus(true);
      response.setData("token", token);
      response.setData("admin", adminData);
      response.setData("login_status", constants.SIGN_IN_STATUS_TYPE.SUCCESS);
      response.setMessage(constants.SIGN_IN_STATUS_MESSAGE.SUCCESS);
      return response;

    } catch (e) {
      logger.error(`Error in AdminAuthService.signIn ${generateError(e)}`);
      throw e;
    }
  };

  const changePassword = async (
    adminId: number, 
    currentPassword: string, 
    newPassword: string
  ): Promise<Response> => {
    const response = new Response(false);

    try {
      // Fetch admin info
      const adminResponse = await adminRepository.getAdminById(adminId);

      if (!adminResponse || !adminResponse.status || !adminResponse.data) {
        response.setStatusCode(404);
        response.setMessage(constants.ERROR_MESSAGES.RESOURCE_NOT_FOUND);
        return response;
      }

      const adminInfo = adminResponse.data;

      // Validate current password
      const passwordIsValid = bcrypt.compareSync(currentPassword, adminInfo.password);
      if (!passwordIsValid) {
        response.setStatusCode(401);
        response.setMessage(constants.SIGN_IN_STATUS_MESSAGE.INCORRECT_PASSWORD);
        return response;
      }

      // Hash new password
      const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

      // Update password
      const updateResult = await adminRepository.updatePassword(adminId, hashedNewPassword);

      if (!updateResult.status) {
        response.setStatusCode(500);
        response.setMessage(constants.ERROR_MESSAGES.SERVER_ERROR);
        return response;
      }

      response.setStatus(true);
      response.setMessage("Password changed successfully");
      return response;

    } catch (e) {
      logger.error(`Error in AdminAuthService.changePassword ${generateError(e)}`);
      throw e;
    }
  };

  return {
    signIn,
    changePassword,
  };
};

export default AdminAuthService; 