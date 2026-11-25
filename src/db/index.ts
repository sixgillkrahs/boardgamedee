import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ override: true });
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not defined");
}

// Giữ singleton connection để tái sử dụng kết nối TCP/TLS giữa các request, nhưng tự làm mới nếu DATABASE_URL trong .env thay đổi khi đang chạy dev server
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
  connUrl: string | undefined;
};

if (globalForDb.conn && globalForDb.connUrl !== connectionString) {
  void globalForDb.conn.end().catch(() => {});
  globalForDb.conn = undefined;
}

const conn =
  globalForDb.conn ??
  postgres(connectionString, {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });
globalForDb.conn = conn;
globalForDb.connUrl = connectionString;

export const db = drizzle(conn, { schema });
