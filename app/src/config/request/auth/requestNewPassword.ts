import { ValidationSchema } from "../interface/request";

const requestNewPassword: ValidationSchema = {
  body: {
    email: {
      type: "string",
      required: true,
    },
  },
};

export default requestNewPassword;
