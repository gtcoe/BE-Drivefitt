import _ from "underscore";
import moment from "moment";

/**
 * Generates a random string based on length and optional type.
 * @param length - Desired length of string.
 * @param type - Type of characters: 'num', 'alpha', 'alphanum', or default mixed.
 * @returns Generated random string.
 */
export const generateRandomString = (
  length = 16,
  type: "num" | "alpha" | "alphanum" | null = null
): string => {
  let chars: string;
  switch (type) {
    case "num":
      chars = "0123456789";
      break;
    case "alpha":
      chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      break;
    case "alphanum":
      chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      break;
    default:
      chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  }

  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

/**
 * Formats an error into a string.
 * @param error - Error to format.
 * @returns Formatted error string.
 */
export const generateError = (error: any): string => {
  if (error.message && error.stack) {
    error = { message: error.message, stack: error.stack };
  }
  if (typeof error === "object") {
    error = JSON.stringify(error);
  }
  return error;
};

/**
 * Concatenates first and last names.
 * @param firstName - First name.
 * @param lastName - Last name.
 * @param toTitleCaseFn - Optional function to convert string to title case.
 * @returns Full name.
 */
export const getFullName = (
  firstName?: string,
  lastName?: string,
  toTitleCaseFn?: (s: string) => string
): string => {
  const fName = firstName || "";
  const lName = lastName || "";
  let fullName = `${fName} ${lName}`.trim();
  if (toTitleCaseFn) {
    fullName = toTitleCaseFn(fullName);
  }
  return fullName;
};

/**
 * Splits a full name into first and last name.
 * @param name - Full name string.
 * @returns Object containing firstName and lastName.
 */
export const getFirstAndLastName = (
  name: string
): { firstName: string; lastName: string } => {
  if (!name) name = "";
  const parts = name.split(" ");
  const firstName = parts[0] || "";
  const lastName = parts.length >= 2 ? parts.slice(1).join(" ") : "";
  return { firstName, lastName };
};

/**
 * Converts snake_case string to camelCase.
 * @param val - Snake case string.
 * @returns Camel case string.
 */
export const snakeToCamelCase = (val: string): string => {
  if (!val) return val;
  return val.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Recursively converts all keys in an object from snake_case to camelCase.
 * @param obj - Object or JSON string.
 * @returns New object with camelCase keys.
 */
export const snakeToObjectToCamelCaseObject = (obj: any): any => {
  try {
    if (typeof obj === "string") {
      obj = JSON.parse(obj);
    }
    const res: any = {};
    for (const key of Object.keys(obj)) {
      const camelKey = snakeToCamelCase(key);
      if (typeof obj[key] === "object" && obj[key] !== null) {
        res[camelKey] = snakeToObjectToCamelCaseObject(obj[key]);
      } else {
        res[camelKey] = obj[key];
      }
    }
    return res;
  } catch (ex) {
    return snakeToCamelCase(String(obj));
  }
};

/**
 * Checks if the system is under maintenance.
 * @returns True if under maintenance, false otherwise.
 */
export const isSystemUnderMaintenance = (): boolean => {
  return Boolean(
    process.env.UNDER_MAINTENANCE &&
      parseInt(process.env.UNDER_MAINTENANCE, 10) === 1
  );
};

/**
 * Dynamically requires a module.
 * @param modulePath - Path of the module.
 * @returns The required module.
 */
export const getModule = (modulePath: string): any => {
  try {
    return require(modulePath);
  } catch (err) {
    throw err;
  }
};

/**
 * Validates a string against a regex pattern.
 * @param str - Input string.
 * @param regex - Regex pattern in string format (e.g., "/pattern/").
 * @returns True if string matches the pattern.
 */
export const validateRegex = (str: string, regex: string): boolean => {
  // Remove the starting and ending delimiters from regex if present.
  const pattern =
    regex.startsWith("/") && regex.endsWith("/") ? regex.slice(1, -1) : regex;
  return new RegExp(pattern).test(str);
};

/**
 * Checks if a value is available in an array or object.
 * @param obj - Array or object.
 * @param value - Value to search for.
 * @returns True if the value is found, false otherwise.
 */
export const isValueAvailableInArray = (
  obj: any,
  value: any
): boolean | null => {
  if (typeof obj !== "object") return null;
  const arr = Array.isArray(obj) ? obj : Object.values(obj);
  return arr.includes(value);
};

/**
 * Parses an error message string to an object.
 * @param obj - Stringified error message.
 * @returns Parsed object if possible; otherwise an object with message property.
 */
export const parseErrorMessage = (obj: string): { message: string } => {
  try {
    return JSON.parse(obj);
  } catch (e) {
    return { message: obj };
  }
};

/**
 * Adds a number of days to a date.
 * @param days - Number of days to add.
 * @param date - Starting date (default is current date).
 * @returns Formatted date string.
 */
export const addDays = (days: number, date: Date = new Date()): string => {
  try {
    date.setDate(date.getDate() + days);
    return moment(date).format("YYYY-MM-DD HH:mm:ss");
  } catch (e) {
    return new Date().toString();
  }
};

/**
 * Formats a Date object to a 12-hour clock format with AM/PM.
 * @param date - Date object.
 * @returns Formatted time string.
 */
export const formatAMPM = (date: Date): string => {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours || 12; // convert hour '0' to '12'
  const minutesStr = minutes < 10 ? "0" + minutes : minutes.toString();
  return `${hours}:${minutesStr} ${ampm}`;
};

const isEmpty = (value: any): boolean => {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  );
};

export const validateSearchParams = (req: any): boolean => {
  // Extract only the keys from the schema
  const searchKeys = Object.keys(req);

  // Check if all search parameters are empty
  const allEmpty = searchKeys.every((key) => isEmpty(req[key]));

  if (allEmpty) {
    return true;
  }
  return false;
};
