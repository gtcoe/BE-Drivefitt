import { Request, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config/auth";
import constants from "../config/constants/constants";
import MySql from "../database/mySql";
import dayjs from "dayjs"; // Lighter alternative to moment.js
import { UserData, GetUserDataDBResponse } from "../repositories/user";
import {setRequestContext, getRequestContext} from "../hooks/asyncHooks";

// JWT Payload Type
interface DecodedToken extends JwtPayload {
  user_id: number;
}

// Middleware to verify JWT token
const verifyToken = async (
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
  console.log("==========>token", token);

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as DecodedToken;
    console.log("==========>decoded", decoded);

    // Fetch user details from DB
    const query = `SELECT name, email, status, type, password_valid_till FROM users WHERE id = ?`;
    const params = [decoded.user_id];
    const userResponse: GetUserDataDBResponse = await MySql.query<UserData[]>(
      query,
      params
    );

    // Error Fetching userInfo
    if (!userResponse || !userResponse.status) {
      throw new Error("unable to fetch user info for token validation");
    }
    const userInfo = userResponse.data ? userResponse.data[0] : null;

    if (!userInfo) {
      return res
        .status(403)
        .json({ status: false, message: "User Not Found", logout: true });
    }

    if (userInfo.status !== constants.STATUS.USER.ACTIVE) {
      return res.status(403).json({
        status: false,
        message: "User Currently Inactive",
        logout: true,
      });
    }

    const passwordValidTill = dayjs(userInfo.password_valid_till);
    if (dayjs().isAfter(passwordValidTill)) {
      return res.status(403).json({
        status: false,
        message: "Password Expired. Request New Password.",
        logout: true,
      });
    }

    // Attach user details to res.locals (best practice)
    req.body = {
      ...req.body,
      token_user_id: decoded.user_id,
      token_user_type: userInfo.type,
      token_user_name: userInfo.name,
      token_user_email: userInfo.email,
    };

    // Set userInfo context in async hooks
    const reqContext = getRequestContext();
    setRequestContext({
      ...reqContext,
      user_id: decoded.user_id,
      type: userInfo.type,
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

export default verifyToken;
