import { ValidationSchema } from "../interface/request";

const getById: ValidationSchema = {
  param: {
    id: {
      type: "number",
      required: true,
      minValue: 1,
    },
  },
};

export default getById;
