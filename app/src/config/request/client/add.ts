import { ValidationSchema } from "../interface/request";
import constants from "../../constants/constants";

const add: ValidationSchema = {
  body: {
    token_user_id: {
      type: "number",
      required: true,
    },
    type: {
      type: "number",
      required: true,
      minValue: constants.CLIENTS_TABLE.TYPE.AGENT,
      maxValue: constants.CLIENTS_TABLE.TYPE.CORPORATE,
    },
    full_name: {
      type: "string",
      required: true,
    },
    address: {
      type: "string",
      required: true,
    },
    branches: {
      type: "string",
      required: true,
    },
    gst_number: {
      type: "string",
      required: true,
    },
    owner_name: {
      type: "string",
      required: true,
    },
    owner_phone: {
      type: "string",
      required: true,
    },
    owner_email: {
      type: "string",
      required: true,
    },
    spoke_name: {
      type: "string",
      required: true,
    },
    spoke_phone: {
      type: "string",
      required: true,
    },
    spoke_email: {
      type: "string",
      required: true,
    },
    billing_cycle: {
      type: "string",
      required: true,
    },
    country: {
      type: "number",
      required: true,
    },
    state: {
      type: "number",
      required: true,
    },
    city: {
      type: "string",
      required: true,
    },
    zip_code: {
      type: "string",
      required: true,
    },
  },
};

export default add;
