
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create a PostgreSQL connection pool with the pooler URL
const connectionString = process.env.DATABASE_URL.replace('.us-east-2', '-pooler.us-east-2');
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: true,
  },
});

// Create a Drizzle instance
export const db = drizzle(pool, { schema });
