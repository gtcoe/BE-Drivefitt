import { ValidationSchema } from "../interface/request";

const signIn: ValidationSchema = {
  body: {
    email: {
      type: "string",
      required: true,
    },
    password: {
      type: "string",
      required: true,
    },
  },
};

export default signIn;
