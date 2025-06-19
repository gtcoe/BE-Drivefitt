import clientController from "../controllers/client";
import hasPermission from "../middleware/roleAuthMiddleware";
import requestValidator from "../middleware/requestValidatorMiddleware";
import clientRequestValidationConfig from "../config/request/client";
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
const clientRouter: Router = express.Router();

// Get all clients
clientRouter
  .route("/")
  .get(
    ...withAuth([
      constants.USER_TABLE.TYPE.ADMIN,
      constants.USER_TABLE.TYPE.MANAGER,
    ]),
    requestValidator(clientRequestValidationConfig.get),
    clientController.getAll
  );

// Get clients by type
clientRouter
  .route("/byType/:type")
  .get(
    ...withAuth([
      constants.USER_TABLE.TYPE.ADMIN,
      constants.USER_TABLE.TYPE.MANAGER,
    ]),
    requestValidator(clientRequestValidationConfig.getByType),
    clientController.getByType
  );

// Create client
clientRouter
  .route("/create")
  .post(
    ...withAuth([
      constants.USER_TABLE.TYPE.ADMIN,
      constants.USER_TABLE.TYPE.MANAGER,
    ]),
    requestValidator(clientRequestValidationConfig.add),
    clientController.create
  );

// Search clients
clientRouter
  .route("/search")
  .post(
    ...withAuth([
      constants.USER_TABLE.TYPE.ADMIN,
      constants.USER_TABLE.TYPE.MANAGER,
      constants.USER_TABLE.TYPE.CLIENT,
    ]),
    requestValidator(clientRequestValidationConfig.search),
    clientController.search
  );

// Get client by client_user_id
clientRouter
  .route("/byId/:client_id")
  .get(
    ...withAuth([
      constants.USER_TABLE.TYPE.ADMIN,
      constants.USER_TABLE.TYPE.MANAGER,
    ]),
    requestValidator(clientRequestValidationConfig.getByClientId),
    clientController.getByClientId
  );

export default clientRouter;
