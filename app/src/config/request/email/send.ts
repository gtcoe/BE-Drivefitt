import { ValidationSchema } from "../interface/request";
import { EMAIL_TYPE } from "../../../models/Email/sendEmailRequest";

const send: ValidationSchema = {
  body: {
    type: {
      type: "number",
      required: true,
      minValue: EMAIL_TYPE.WELCOME,
      maxValue: EMAIL_TYPE.DOCUMENT_CHECKLIST,
    },
  },
};

export default send;
