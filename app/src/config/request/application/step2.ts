import {ValidationSchema} from '../interface/request'

// todo add min max value check

const step2: ValidationSchema = {
    body: {
      token_user_id: {
        type: "number",
        required: true,
      },
      pax_id: {
        type: "number",
        required: true,
      },
      reference_number: {
        type: "number",
        required: true,
      },
    },
  };
  
  export default step2;