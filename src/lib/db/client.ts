import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __dbSql?: ReturnType<typeof postgres>;
  __db?: Db;
};

function init(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. See README.md → Database for how to provision and wire it.",
    );
  }
  const sql =
    globalForDb.__dbSql ??
    postgres(url, { prepare: false, max: 1, idle_timeout: 20 });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__dbSql = sql;
  }
  const db = drizzle(sql, { schema });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__db = db;
  }
  return db;
}

export function getDb(): Db {
  return globalForDb.__db ?? init();
}

export { schema };
