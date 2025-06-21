import { and, eq, isNotNull } from "drizzle-orm"
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
            eq(companyUrls.isSelected, true),
            isNotNull(companyUrls.rawHtml)
          ),
          columns: {
            url: true,
          },
        })
      ).map(async (r) => ({
        ...r,
        ...(await db.query.contents.findFirst({
          where: and(
            eq(contents.registrationNumber, registrationNumber),
            eq(contents.url, r.url)
          ),
          columns: { content: true },
        })),
      }))
    )
  ).map((r) =>
    schema.parse({
      url: new URL(r.url as string).pathname,
      content: r.content,
    })
  )
