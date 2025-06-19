import mysql, { Pool, PoolConnection, QueryError } from "mysql2";
import { logger } from "../logging";
import dbConfig from "../config/mysql";

// Load environment-specific MySQL config
const envDBConfig = dbConfig.prod;
// const envDBConfig = dbConfig.dev;

// Create MySQL connection pool
const mysqlPool: Pool = mysql.createPool({
  host: envDBConfig.HOST,
  user: envDBConfig.USER,
  password: envDBConfig.PASSWORD,
  database: envDBConfig.DB,
  connectionLimit: envDBConfig.max, // Max connections
  waitForConnections: true,
  queueLimit: 0,
  multipleStatements: true, // Allow multiple queries in one statement
});

// **MySQL Database Class**
class Mysql {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  protected generateErrorResponse(err: QueryError) {
    const result = {
      status: false,
      code: err.code,
      message: err.message,
    };
    logger.error(`MySQL Error - ${JSON.stringify(result)} | SQL: ${err}`);
    return result;
  }

  async query<T = any>(
    sql: string,
    params: any[] = []
  ): Promise<{ status: boolean; data: T | null }> {
    // Log the SQL query and parameters
    logger.info(`SQL Query: ${sql}, { params }: ${ params }`);
    
    return new Promise((resolve, reject) => {
      this.pool.query(sql, params, (err: any, results: any) => {
        if (err) {
          reject(this.generateErrorResponse(err));
        } else {
          if (sql.slice(0, 6) === "insert") {
            if (!results || typeof results.insertId !== "number") {
              throw new Error("Unexpected response from database");
            }
          }
          // Log successful query results (limited to prevent excessive logging)
          const resultLog = Array.isArray(results) 
            ? `Results: ${results.length} rows returned` 
            : `Result: ${JSON.stringify(results).substring(0, 200)}${JSON.stringify(results).length > 200 ? '...' : ''}`;
          logger.info(`SQL Query Success: ${resultLog}`);
          
          resolve({ status: true, data: results });
        }
      });
    });
  }

  async getConnection(): Promise<Connection> {
    return new Promise((resolve, reject) => {
      this.pool.getConnection((err: any, connection: any) => {
        if (err) {
          reject(this.generateErrorResponse(err));
        } else {
          resolve(new Connection(this.pool, connection));
        }
      });
    });
  }
}

// **MySQL Connection Class (For Transactions)**
class Connection extends Mysql {
  private connection: PoolConnection;

  constructor(pool: Pool, connection: PoolConnection) {
    super(pool);
    this.connection = connection;
  }

  async query<T = any>(
    sql: string,
    params: any[] = []
  ): Promise<{ status: boolean; data: T | null }> {
    // Log the SQL query and parameters
    logger.info(`Transaction SQL Query: ${sql}`, { params });
    
    return new Promise((resolve, reject) => {
      this.connection.query(sql, params, (err: any, results: any) => {
        if (err) {
          reject(this.generateErrorResponse(err));
        } else {
          if (sql.slice(0, 6) === "INSERT") {
            if (!results || typeof results.insertId !== "number") {
              throw new Error("Unexpected response from database");
            }
          }
          // Log successful query results (limited to prevent excessive logging)
          const resultLog = Array.isArray(results) 
            ? `Results: ${results.length} rows returned` 
            : `Result: ${JSON.stringify(results).substring(0, 200)}${JSON.stringify(results).length > 200 ? '...' : ''}`;
          logger.info(`Transaction SQL Query Success: ${resultLog}`);
          
          resolve({ status: true, data: results });
        }
      });
    });
  }

  async beginTransaction(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connection.beginTransaction((err: any) => {
        if (err) reject(this.generateErrorResponse(err));
        else resolve();
      });
    });
  }

  async commit(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connection.commit((err: any) => {
        if (err) reject(this.generateErrorResponse(err));
        else resolve();
      });
    });
  }

  async rollback(): Promise<void> {
    return new Promise((resolve, _) => {
      this.connection.rollback(() => resolve());
    });
  }

  release(): void {
    this.connection.release();
  }
}

// Export MySQL instance
const mysqlDB = new Mysql(mysqlPool);
Object.freeze(mysqlDB);

export default mysqlDB;
