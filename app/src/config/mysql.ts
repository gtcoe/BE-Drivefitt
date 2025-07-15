interface DbConfig {
  HOST: string;
  USER: string;
  PASSWORD: string;
  DB: string;
  port: number | string;
  max: number;
  min: number;
  acquire: number;
  idle: number;
}

const MySqlConfig: { dev: DbConfig; prod: DbConfig } = {
  dev: {
    HOST: process.env.MYSQL_HOST || "drivefitt.cf8ae4q4e0jo.ap-south-1.rds.amazonaws.com",
    USER: process.env.MYSQL_USER || "admin",
    PASSWORD: process.env.MYSQL_PASS || "drivefitt12345",
    DB: process.env.MYSQL_DB || "drivefitt",
    port: process.env.MYSQL_PORT || 3306,
    max: 50,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  prod: {
    HOST: process.env.MYSQL_HOST || "",
    USER: process.env.MYSQL_USER || "",
    PASSWORD: process.env.MYSQL_PASS || "",
    DB: process.env.MYSQL_DB || "",
    port: process.env.MYSQL_PORT || 3306,
    max: 50,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

export default MySqlConfig;
