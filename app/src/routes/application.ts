import applicationController from "../controllers/application";
import hasPermission from "../middleware/roleAuthMiddleware";
import requestValidator from "../middleware/requestValidatorMiddleware";
import applicationRequestValidationConfig from "../config/request/application";
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
const applicationRouter: Router = express.Router();

applicationRouter
  .route("/step1")
  .post(
    ...withAuth([
      constants.USER_TABLE.TYPE.ADMIN,
      constants.USER_TABLE.TYPE.MANAGER,
    ]),
    requestValidator(applicationRequestValidationConfig.step1),
    applicationController.addStep1Data
  );

applicationRouter
  .route("/step2")
  .post(
    ...withAuth([
      constants.USER_TABLE.TYPE.ADMIN,
      constants.USER_TABLE.TYPE.MANAGER,
    ]),
    requestValidator(applicationRequestValidationConfig.step2),
    applicationController.addStep2Data
  );

applicationRouter
  .route("/step3")
  .post(
    ...withAuth([
      constants.USER_TABLE.TYPE.ADMIN,
      constants.USER_TABLE.TYPE.MANAGER,
    ]),
    requestValidator(applicationRequestValidationConfig.step3),
    applicationController.addStep3Data
  );

// Search users
//Done
applicationRouter
  .route("/searchPax")
  .post(
    ...withAuth([
      constants.USER_TABLE.TYPE.ADMIN,
      constants.USER_TABLE.TYPE.MANAGER,
    ]),
    requestValidator(applicationRequestValidationConfig.searchPax),
    applicationController.searchPax
  );

applicationRouter
  .route("/step4")
  .post(
    ...withAuth([
      constants.USER_TABLE.TYPE.ADMIN,
      constants.USER_TABLE.TYPE.MANAGER,
    ]),
    requestValidator(applicationRequestValidationConfig.step4),
    applicationController.addStep4Data
  );

//Done
applicationRouter
  .route("/search")
  .post(
    ...withAuth([
      constants.USER_TABLE.TYPE.ADMIN,
      constants.USER_TABLE.TYPE.MANAGER,
      constants.USER_TABLE.TYPE.CLIENT]),
    requestValidator(applicationRequestValidationConfig.search),
    applicationController.search
  );

// Update Application Details
applicationRouter
  .route("/:id")
  .put(
    ...withAuth([
      constants.USER_TABLE.TYPE.ADMIN,
      constants.USER_TABLE.TYPE.MANAGER,
    ]),
    requestValidator(applicationRequestValidationConfig.updateApplication),
    applicationController.updateApplicationDetails
  );

export default applicationRouter;
