import { ValidationSchema } from "../interface/request";
import { APPLICATION_EXTERNAL_STATUS, APPLICATION_QUEUES } from "../../applicationStatus";

const validationSchema: ValidationSchema = {
  body: {
    id: {
      type: "number",
      required: true,
      minValue: 1,
    },
    queue: {
      type: "number",
      required: true,
      minValue: APPLICATION_QUEUES.IN_TRANSIT,
      maxValue: APPLICATION_QUEUES.BILLING,
    },
    external_status: {
      type: "number",
      required: true,
      minValue: APPLICATION_EXTERNAL_STATUS.DOC_RECIVED,
      maxValue: APPLICATION_EXTERNAL_STATUS.WITHDRAWN_SENT,
    },
    team_remarks: {
      type: "string",
      required: false,
    },
    client_remarks: {
      type: "string",
      required: false,
    },
    billing_remarks: {
      type: "string",
      required: false,
    },
    dox_received_at: {
      type: "string",
      required: false,
    },
    submission_at: {
      type: "string",
      required: false,
    },
    collection_at: {
      type: "string",
      required: false,
    },
    token_user_id: {
      type: "number",
      required: true,
    },
  },
};

export default validationSchema; 