import { Application, NextFunction } from "express";
import { app } from "./app";
import bodyParser from "body-parser";
import cors from "cors";
import json2xls from "json2xls";
// import AWS from "aws-sdk";
import MySql from "./database/mySql";
import { logger } from "./logging";
import { setRequestContext } from "./hooks/asyncHooks";

// import s3Config from "./app/config/s3BucketConfig";

// Load environment variables
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8081;
// const ENV = process.env.NODE_ENV || "development";
// const AWS_REGION = process.env.AWS_REGION || s3Config[ENV]?.REGION;
// const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || s3Config[ENV]?.ACCESS_KEY_ID;
// const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || s3Config[ENV]?.SECRET_ACCESS_KEY;

// Middleware setup
const setupMiddleware = (app: Application) => {
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(json2xls.middleware);
  app.use(
    bodyParser.json({
      verify: (req: any & { rawBody?: string }, _, buf) => {
        req.rawBody = buf.toString();
      },
    })
  );
  // Allow requests from specific origins
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://be-visa-tracker.vercel.app',
    'https://visa-tracker-gilt.vercel.app',
    'https://visa-tracker.vercel.app',
    'https://visaistic.vercel.app',
    'https://fe-visa-tracker-gtcoes-projects.vercel.app',
    // Add your production frontend URL here
  ];

  const corsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      // For development or when no origin is provided (like Postman requests)
      if (!origin || process.env.NODE_ENV === 'development') {
        callback(null, true);
        return;
      }
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,  // Allow cookies if needed
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Auth_token']
  };
  app.use(cors(corsOptions));
  app.disable("x-powered-by");
  app.set("port", PORT);

  app.use((req: any, res: any, next: NextFunction) => {
    setRequestContext({
      requestId: "abc", // todo: generate random string
      endpoint: req.originalUrl,
    });

    const oldSend = res.send.bind(res);
    let isLogged = true;

    res.send = (body: any) => {
      if (isLogged) {
        logger.info(
          `api request - ${
            (req.token && "driver:" + req.token.driverId) || ""
          } ` +
            JSON.stringify({
              url: req.originalUrl,
              request: req.body,
              code: res.statusCode,
              response: body,
              headers: req.headers,
            })
        );
      }
      isLogged = false;
      return oldSend(body); // Ensure the response object is returned
    };
    next();
  });
};

// AWS Configuration
// const configureAWS = () => {
//   if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
//     logger.error("AWS credentials are missing! Check your environment variables.");
//     process.exit(1);
//   }

//   AWS.config.update({
//     region: AWS_REGION,
//     accessKeyId: AWS_ACCESS_KEY_ID,
//     secretAccessKey: AWS_SECRET_ACCESS_KEY,
//   });

//   logger.info("AWS Configuration Loaded Successfully");
// };

// Database Keep-Alive
const keepDatabaseAlive = async () => {
  try {
    await MySql.query("SELECT 1 p");
  } catch (error) {
    logger.error("Error in SELECT 1 p: ", error);
  }
};

// Start Server
const startServer = () => {
  setupMiddleware(app);
  // configureAWS();
  // require("./routes")();
  // import("./routes").then((module) => module.default());
  // const routes =  import("./routes");
  // routes.default();
  setInterval(keepDatabaseAlive, 5000);
  
  // Use require for CommonJS modules
  const routes = require("./routes");
  app.use("/api", routes.default);
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

// Start Application
startServer();
