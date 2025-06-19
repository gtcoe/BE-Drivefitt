// import express, {
//   Express,
//   Request,
//   Response,
//   NextFunction,
//   Router,
// } from "express";

import express from "express";
import type { Express, NextFunction, Router } from "express"; // Only import types that are needed

const app: Express = express();

export { express, app, NextFunction, Router };
