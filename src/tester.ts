import { and, eq } from "drizzle-orm"
import { db } from "./db"
import { llm } from "./llm"
import { companyUrls, contents } from "./db/schema"
import { z } from "zod"

const schema = z.object({
  registrationNumber: z.string(),
  url: z.string(),
  content: z.string(),
})

const main = async () => {
  const results = (
    await Promise.all(
      (
        await db.query.companyUrls.findMany({
          where: and(
            eq(companyUrls.registrationNumber, "0125559027722"),
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

  console.log(await llm(results))
}

main()
