import { Pool, createPool } from "mysql2/promise";

async function connect(): Promise<Pool> {
  const connection = await createPool({
    host: "localhost",
    user: "root",
    password: "password",
    database: "auth_jwt",
    connectionLimit: 5,
  });
  console.log("MySQL connected");
  return connection;
}

export default connect;
