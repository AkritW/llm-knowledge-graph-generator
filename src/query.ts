import { and, eq } from "drizzle-orm"
import { db } from "./db"
import { companySummaries, companyUrls, contents } from "./db/schema"
import { z } from "zod"

export const isAlreadyExist = async (registrationNumber: string) => {
  const result = await db.query.companySummaries.findFirst({
    where: eq(companySummaries.registrationNumber, registrationNumber),
  })

  return !!result
}

const schema = z.object({
  registrationNumber: z.string(),
  url: z.string(),
  content: z.string(),
})

export const queryCompanyContents = async (registrationNumber: string) =>
  (
    await Promise.all(
      (
        await db.query.companyUrls.findMany({
          where: and(
            eq(companyUrls.registrationNumber, registrationNumber),
            eq(companyUrls.isSelected, true)
          ),
          columns: {
            id: true,
            registrationNumber: true,
            url: true,
          },
        })
      ).map(async (r) => ({
        ...r,
        ...(await db.query.contents.findFirst({
          where: eq(contents.urlId, r.id),
          columns: { content: true },
        })),
      }))
    )
  ).map((r) =>
    schema.parse({
      registrationNumber: r.registrationNumber,
      content: r.content || "",
      url: new URL(r.url as string).pathname,
    })
  )
