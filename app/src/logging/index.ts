import { createLogger, format, transports } from "winston";
import fs from "fs";
import {setRequestContext, getRequestContext} from "../hooks/asyncHooks";
import { generateRandomString } from "../services/util";

// // Manually define `__dirname` in ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// // Define Log Directory
// const logDir: string = process.env.LOG_DIR || path.join(__dirname, "../logs");


// Define log directory in a writable location for serverless environments
const logDir: string = process.env.LOG_DIR || '/tmp/logs';

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define structured log context
interface LogContext {
  requestId?: string;
  userId?: string;
  userType?: string;
}

// Function to generate log string with request context
const getLogString = (info: any): string => {
  const {
    requestId = "",
    userId = "",
    userType = "",
  }: LogContext = getRequestContext() || {};
  const contextInfo: string[] = [];

  if (requestId) contextInfo.push(`[REQUEST_ID: ${requestId}]`);
  if (userType || userId)
    contextInfo.push(`[USER: ${userType || ""}_${userId || ""}]`);

  return `${info.timestamp} ${contextInfo.join(" ")} ${info.level}: ${
    info.message
  }`;
};

// Create Winston Logger
const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    format.printf((info: any) => getLogString(info))
  ),
  transports: [
    new transports.Console({
      level: "info",
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
        format.printf((info: any) => getLogString(info))
      ),
    }),
    /* Uncomment to enable file logging
        new transports.File({
            filename: path.join(logDir, "error.log"),
            level: "error",
            maxsize: 10000,
            tailable: true,
            handleExceptions: true,
        }),
        new transports.File({
            filename: path.join(logDir, "out.log"),
            level: "info",
            maxsize: 30000,
            tailable: true,
            handleExceptions: true,
        }),
        */
  ],
  exitOnError: false,
});

// Function to set log context for request
const setContextForLog = ({
  requestId = generateRandomString(15),
  userType = "NO_TYPE",
  userId = "NO_ID",
}: LogContext): void => {
  setRequestContext({ requestId, userType, userId });
};

// Export logger & context setter
export { logger, setContextForLog };
