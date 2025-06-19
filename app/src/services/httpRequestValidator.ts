import { validateRegex } from "./util";

interface ValidationRules {
  required?: boolean;
  type?: string;
  length?: number;
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: { validations: any };
  items?: ValidationRules; // For array item validation
  properties?: { [key: string]: ValidationRules }; // For object property validation
  // You can extend this interface if additional rules are needed.
  [key: string]: any;
}

export interface ErrorResponse {
  type?: string;
  param: string;
  expected_type?: string;
  message?: string;
}

interface ValidationSchema {
  [field: string]: ValidationRules;
}

// const skipAble: Record<string, number> = {
//   required: 1,
//   type: 1,
//   length: 1,
//   minValue: 1,
//   maxValue: 1,
//   minLength: 1,
//   maxLength: 1,
//   items: 1,
//   properties: 1,
// };

const validate = (method: string, value: any, rule: any): boolean => {
  switch (method) {
    case "required":
      return required(value);
    case "type":
      return validateDataType(value, rule);
    case "length":
      return length(value, rule);
    case "minValue":
      return minValue(value, rule);
    case "maxValue":
      return maxValue(value, rule);
    case "minLength":
      return minLength(value, rule);
    case "maxLength":
      return maxLength(value, rule);
    case "pattern":
      return pattern(value, rule);
    case "items":
      return validateArrayItems(value, rule);
    default:
      return true;
  }
};

const validateDataType = (value: any, expected: string): boolean => {
  if (expected === "array") {
    return Array.isArray(value);
  }
  return typeof value === expected;
};

const validateArrayItems = (value: any, itemRules: ValidationRules): boolean => {
  if (!Array.isArray(value)) return false;
  
  // If no items are defined, any array is valid
  if (!itemRules) return true;
  
  // Check each item in the array against the item rules
  for (const item of value) {
    // If the item should be an object with properties
    if (itemRules.type === 'object' && itemRules.properties) {
      // Check if the item is an object
      if (typeof item !== 'object' || item === null || Array.isArray(item)) {
        return false;
      }
      
      // Validate each property of the object
      for (const propKey of Object.keys(itemRules.properties)) {
        const propRules = itemRules.properties[propKey];
        
        // Check if property is required but missing
        if (propRules.required && (item[propKey] === undefined || item[propKey] === null)) {
          return false;
        }
        
        // Skip validation if property is not required and is not present
        if ((item[propKey] === undefined || item[propKey] === null) && !propRules.required) {
          continue;
        }
        
        // Validate the property against its rules
        for (const ruleKey of Object.keys(propRules)) {
          if (ruleKey === 'properties' || ruleKey === 'items') continue;
          if (!validate(ruleKey, item[propKey], propRules[ruleKey])) {
            return false;
          }
        }
      }
    } else {
      // For non-object items, validate directly against the rules
      for (const ruleKey of Object.keys(itemRules)) {
        if (!validate(ruleKey, item, itemRules[ruleKey])) {
          return false;
        }
      }
    }
  }
  
  return true;
};

const length = (value: any, len: number): boolean => {
  if (Array.isArray(value)) {
    return value.length === len;
  }
  return value.toString().length === len;
};

const required = (value: any): boolean => {
  return value !== undefined && value !== null;
};

const pattern = (value: any, validation: { validations: any }): boolean => {
  return validateRegex(value, validation.validations);
};

const minLength = (value: any, len: number = 1): boolean => {
  if (Array.isArray(value)) {
    return value.length >= len;
  }
  return value.toString().trim().length >= len;
};

const maxLength = (value: any, len: number = 1): boolean => {
  if (Array.isArray(value)) {
    return value.length <= len;
  }
  return value.toString().trim().length <= len;
};

const minValue = (value: any, min: number): boolean => {
  return value >= min;
};

const maxValue = (value: any, max: number): boolean => {
  return value <= max;
};

// const multiplePattern = (
//   value: any,
//   validation: { validations: any[] }
// ): boolean => {
//   for (let i = 0; i < validation.validations.length; ++i) {
//     if (!pattern(value, { validations: validation.validations[i] }))
//       return false;
//   }
//   return true;
// };

const generateErrorResponse = (
  type: string,
  requestKey: string,
  targetType?: any
): ErrorResponse => {
  const error: ErrorResponse = {
    type,
    param: requestKey,
  };

  if (type === "type") {
    error.expected_type = targetType;
  } else if (type === "minLength") {
    delete error.type;
    error.message = `Minimum length ${targetType} is required for ${requestKey}`;
  } else if (type === "maxLength") {
    delete error.type;
    error.message = `Maximum length ${targetType} is required for ${requestKey}`;
  } else if (type === "minValue") {
    delete error.type;
    error.message = `Minimum value can be ${targetType} for ${requestKey}`;
  } else if (type === "maxValue") {
    delete error.type;
    error.message = `Maximum value can be ${targetType} for ${requestKey}`;
  } else if (type === "items") {
    delete error.type;
    error.message = `Invalid items in array for ${requestKey}`;
  }

  return error;
};

const init = (
  reqData: any,
  reqValidation: ValidationSchema
): ErrorResponse[] => {
  const errors: ErrorResponse[] = [];

  if (!reqValidation) return errors;

  const fieldKeys = Object.keys(reqValidation);
  for (const requestKey of fieldKeys) {
    const rules: ValidationRules = reqValidation[requestKey];

    // If there is no request data at all, return an error immediately.
    if (reqData === undefined || reqData === null) {
      errors.push(generateErrorResponse("required", requestKey));
      continue;
    }

    // Special handling for required rule - check this first
    if (rules.required && (reqData[requestKey] === undefined || reqData[requestKey] === null)) {
      errors.push(generateErrorResponse("required", requestKey));
      continue;
    }

    // Skip further validation if the field is not present and not required
    if ((reqData[requestKey] === undefined || reqData[requestKey] === null) && !rules.required) {
      continue;
    }

    // Check the type if specified
    if (rules.type) {
      if (!validateDataType(reqData[requestKey], rules.type)) {
        errors.push(generateErrorResponse("type", requestKey, rules.type));
        continue;
      }

      // If it's an array type and has item validation, check each item
      if (rules.type === "array" && rules.items && Array.isArray(reqData[requestKey])) {
        for (let i = 0; i < reqData[requestKey].length; i++) {
          // Handle the case where items are objects with properties
          if (rules.items.type === "object" && rules.items.properties) {
            const itemErrors = init(reqData[requestKey][i], rules.items.properties);
            if (itemErrors.length > 0) {
              errors.push(...itemErrors.map(err => ({
                ...err,
                param: `${requestKey}[${i}].${err.param}`
              })));
            }
          } else {
            // For non-object item types
            const itemErrors = init(reqData[requestKey][i], { item: rules.items });
            if (itemErrors.length > 0) {
              errors.push(generateErrorResponse("items", `${requestKey}[${i}]`));
            }
          }
        }
        continue;
      }
    }

    // Process nested objects if the rule has properties
    if (rules.properties && typeof reqData[requestKey] === "object" && !Array.isArray(reqData[requestKey])) {
      errors.push(...init(reqData[requestKey], rules.properties));
      continue;
    }

    // Process the remaining validation rules
    const ruleKeys = Object.keys(rules).filter(key => !['type', 'required', 'properties', 'items'].includes(key));
    for (const ruleKey of ruleKeys) {
      const isValid = validate(ruleKey, reqData[requestKey], rules[ruleKey]);
      if (!isValid) {
        errors.push(generateErrorResponse(ruleKey, requestKey, rules[ruleKey]));
        break;
      }
    }
  }

  return errors;
};

export default {
  init,
};
