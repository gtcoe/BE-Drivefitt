import userController from "../controllers/user";
import hasPermission from "../middleware/roleAuthMiddleware";
import requestValidator from "../middleware/requestValidatorMiddleware";
import userRequestValidationConfig from "../config/request/user";
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
const userRouter: Router = express.Router();

//Done
userRouter
  .route("/:id")
  .get(
    ...withAuth([
      constants.USER_TABLE.TYPE.ADMIN,
      constants.USER_TABLE.TYPE.MANAGER,
      constants.USER_TABLE.TYPE.CLIENT,
    ]),
    requestValidator(userRequestValidationConfig.getById),
    userController.getById
  );

//Done
// Get all users
userRouter
  .route("/")
  .get(
    ...withAuth([constants.USER_TABLE.TYPE.ADMIN]),
    requestValidator(userRequestValidationConfig.get),
    userController.getAll
  );

//Done
// Add user
userRouter
  .route("/create")
  .post(
    ...withAuth([constants.USER_TABLE.TYPE.ADMIN]),
    requestValidator(userRequestValidationConfig.add),
    userController.addUser
  );

//Done
// Update user status
userRouter
  .route("/status")
  .post(
    ...withAuth([constants.USER_TABLE.TYPE.ADMIN]),
    requestValidator(userRequestValidationConfig.updateStatus),
    userController.updateStatus
  );

// Search users
//Done
userRouter
  .route("/search")
  .post(
    ...withAuth([constants.USER_TABLE.TYPE.ADMIN]),
    requestValidator(userRequestValidationConfig.search),
    userController.search
  );

export default userRouter;
