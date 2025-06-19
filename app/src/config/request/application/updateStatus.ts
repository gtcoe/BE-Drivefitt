import constants from "../../constants/constants";
import { ValidationSchema } from "../interface/request";

const validationSchema: ValidationSchema = {
  body: {
    status: {
      type: "number",
      required: true,
      minValue: constants.STATUS.USER.ACTIVE,
      maxValue: constants.STATUS.USER.INACTIVE,
    },
    user_id: {
      type: "number",
      required: true,
      minValue: 1,
    },
    token_user_id: {
      type: "number",
      required: true,
    },
  },
};

export default validationSchema;
