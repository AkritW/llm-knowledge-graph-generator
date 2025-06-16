import { db } from "./db"
import { companySummaries } from "./db/schema"

export const insertSummary = async (payload: {
  registrationNumber: string
  description: string
  news: string | null
}) => {
  const result = await db
    .insert(companySummaries)
    .values({
      registrationNumber: payload.registrationNumber,
      description: payload.description,
      news: payload.news,
    })
    .returning({ registrationNumber: companySummaries.registrationNumber })

  if (!result[0]) {
    throw Error("")
  }

  return result[0]
}
