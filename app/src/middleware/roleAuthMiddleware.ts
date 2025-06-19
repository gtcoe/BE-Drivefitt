import { Request, NextFunction, RequestHandler } from "express";

interface AuthRequest extends Request {
  type_required?: number[]; // Assuming it's an array of allowed types
  body: {
    token_user_type: number; // The type of request being checked
  };
}

// Middleware to check if the user has permission
const hasPermission: RequestHandler = async (
  req: AuthRequest,
  res: any,
  next: NextFunction
) => {
  if (!req.type_required || !Array.isArray(req.type_required)) {
    return res.status(400).json({
      status: false,
      message:
        "Invalid request: 'type_required' is missing or incorrectly formatted.",
    });
  }

  if (req.type_required.includes(req.body.token_user_type)) {
    return next();
  }

  return res.status(403).json({
    status: false,
    message:
      "You do not have the correct permission to perform this operation.",
  });
};

export default hasPermission;
