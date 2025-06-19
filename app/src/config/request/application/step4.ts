import { ValidationSchema } from "../interface/request";

// todo add min max value check

const step4: ValidationSchema = {
  body: {
    token_user_id: {
      type: "number",
      required: true,
    },
    dispatch_medium: {
      type: "number",
      required: true,
    },
    dispatch_medium_number: {
      type: "string",
      required: true,
    },
    remarks: {
      type: "string",
      required: true,
    },
    reference_number: {
      type: "string",
      required: true,
    },
  },
};

export default step4;
