import { Request, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import authConfig from "../config/auth";
import constants from "../config/constants/drivefitt-constants";
import MySql from "../database/mySql";
import { Admin } from "../models/Admin/admin";
import { setRequestContext, getRequestContext } from "../hooks/asyncHooks";

interface DecodedToken extends JwtPayload {
  admin_id: number;
  email: string;
  name: string;
}

const verifyAdminToken = async (
  req: Request,
  res: any,
  next: NextFunction
): Promise<any> => {
  req.headers.languagecode = req.headers.languagecode || "en";
  req.headers["accept-version"] = req.headers["accept-version"] || "1.0.0";

  const token = req.body.token || req.query.token || req.headers.auth_token;
  if (!token) {
    return res
      .status(401)
      .json({ status: false, message: "No token provided." });
  }

  try {
    const decoded = jwt.verify(token, authConfig.jwtSecret) as DecodedToken;

    // Fetch admin details from DB
    const query = `SELECT id, name, email, status FROM ${constants.TABLES.ADMINS} WHERE id = ?`;
    const params = [decoded.admin_id];
    const adminResponse = await MySql.query<Admin[]>(query, params);

    // Error fetching admin info
    if (!adminResponse || !adminResponse.status) {
      throw new Error("unable to fetch admin info for token validation");
    }
    const adminInfo = adminResponse.data ? adminResponse.data[0] : null;

    if (!adminInfo) {
      return res
        .status(403)
        .json({ status: false, message: "Admin Not Found", logout: true });
    }

    if (adminInfo.status !== constants.STATUS.ADMIN.ACTIVE) {
      return res.status(403).json({
        status: false,
        message: "Admin Account Inactive",
        logout: true,
      });
    }

    // Attach admin details to request body
    req.body = {
      ...req.body,
      token_user_id: decoded.admin_id,
      token_user_type: "admin",
      token_user_name: adminInfo.name,
      token_user_email: adminInfo.email,
    };

    // Set admin context in async hooks
    const reqContext = getRequestContext();
    setRequestContext({
      ...reqContext,
      user_id: decoded.admin_id,
      type: "admin",
      userType: "admin",
      userId: decoded.admin_id.toString(),
    });

    next();
  } catch (err) {
    console.error("JWT Verification Error:", err);
    return res.status(403).json({
      status: false,
      message: "Failed to authenticate token.",
      logout: true,
    });
  }
};

export default verifyAdminToken; 