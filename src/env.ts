import { z } from "zod"

const envSchema = z.object({
  LEAD_DATABASE_URL: z.string(),
  RABBITMQ_URL: z.string(),
  DEEPSEEK_API_KEY: z.string(),
  BATCH_SIZE: z.string(),
})

export const env = envSchema.parse(process.env)
