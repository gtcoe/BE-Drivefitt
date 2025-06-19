import authController from "../controllers/auth";
import { app, express, NextFunction, Router } from "../app";
import requestValidator from "../middleware/requestValidatorMiddleware";
import authRequestValidationConfig from "../config/request/auth";

const setHeaders = (_: any, res: any, next: NextFunction): void => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
};

const authRouter: Router = express.Router();

// Apply headers middleware globally
app.use(setHeaders);

// Public Routes
authRouter.post(
  "/signin",
  requestValidator(authRequestValidationConfig.signIn),
  authController.signIn
);
authRouter.post(
  "/requestNewPassword",
  requestValidator(authRequestValidationConfig.requestNewPassword),
  authController.requestNewPassword
);

export default authRouter;
