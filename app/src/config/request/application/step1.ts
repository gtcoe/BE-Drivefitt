import { ValidationSchema } from "../interface/request";

// todo add min max value check
const step1: ValidationSchema = {
  body: {
    token_user_id: {
      type: "number",
      required: true,
    },
    pax_type: {
      type: "number",
      required: true,
    },
    country_of_residence: {
      type: "number",
      required: true,
    },
    client_user_id: {
      type: "number",
      required: true,
    },
    state_of_residence: {
      type: "number",
      required: true,
    },
    citizenship: {
      type: "number",
      required: true,
    },
    service_type: {
      type: "number",
      required: true,
    },
    referrer: {
      type: "string",
      required: true,
    },
    file_number: {
      type: "string",
      required: true,
    },
  },
};

export default step1;
