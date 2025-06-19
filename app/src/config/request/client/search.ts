import { ValidationSchema } from "../interface/request";

const search: ValidationSchema = {
  body: {
    text: {
      type: "string",
      required: true,
      minLength: 1,
      maxLength: 100,
    },
  },
};

export default search; 