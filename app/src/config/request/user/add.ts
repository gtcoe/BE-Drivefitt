import { ValidationSchema } from "../interface/request";
import constants from "../../constants/constants";

const add: ValidationSchema = {
  body: {
    token_user_id: {
      type: "number",
      required: true,
    },
    name: {
      type: "string",
      required: true,
    },
    email: {
      type: "string",
      required: true,
    },
    type: {
      type: "number",
      required: true,
      minValue: constants.USER_TABLE.TYPE.ADMIN,
      maxValue: constants.USER_TABLE.TYPE.MANAGER,
    },
    status: {
      type: "number",
      required: true,
      minValue: constants.STATUS.USER.ACTIVE,
      maxValue: constants.STATUS.USER.INACTIVE,
    },
  },
};

export default add;
