import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"
import { env } from "@src/env"

const pool = new Pool({
  connectionString: env.LEAD_DATABASE_URL,
  max: 1,
})

export const db = drizzle(pool, { schema })
