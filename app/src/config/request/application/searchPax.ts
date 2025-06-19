import {ValidationSchema} from '../interface/request'

const searchPax: ValidationSchema = {
    body: {
      pax_name: {
        type: "string",
        required: false,
      },
      passport_number: {
        type: "string",
        required: false,
      },
      reference_number: {
        type: "string",
        required: false,
      },
    },
  };
  
  export default searchPax;