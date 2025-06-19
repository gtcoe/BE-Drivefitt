import emailController from "../controllers/email";
import hasPermission from "../middleware/roleAuthMiddleware";
import requestValidator from "../middleware/requestValidatorMiddleware";
import emailRequestValidationConfig from "../config/request/email";
import constants from "../config/constants/constants";
import { express, NextFunction, Router } from "../app";

// Helper middleware to assign role-based permissions
const withAuth = (roles: number[]) => [
  (req: any, _: any, next: NextFunction) => {
    req.type_required = roles;
    next();
  },
  hasPermission,
];

// Initialize router
const emailRouter: Router = express.Router();

// Send email route
emailRouter
  .route("/send")
  .post(
    ...withAuth([
      constants.USER_TABLE.TYPE.ADMIN,
      constants.USER_TABLE.TYPE.MANAGER
    ]),
    requestValidator(emailRequestValidationConfig.send),
    emailController.sendEmail
  );

export default emailRouter; 