import { and, eq, isNotNull } from "drizzle-orm"
import { db } from "./db"
import { llm } from "./llm"
import { companyUrls, contents } from "./db/schema"
import { z } from "zod"
import { queryCompanyContents } from "./query"

const schema = z.object({
  registrationNumber: z.string(),
  url: z.string(),
  content: z.string(),
})

const main = async () => {
  const registrationNumber = "0105561008586"
  const results = await Promise.all(
    (
      await db.query.companyUrls.findMany({
        where: and(
          isNotNull(companyUrls.rawHtml),
          eq(companyUrls.registrationNumber, registrationNumber),
          eq(companyUrls.isSelected, true)
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

  console.log(results)

  // const a = await db.query.companyUrls.findMany({
  //   where: and(
  //     eq(companyUrls.registrationNumber, registrationNumber),
  //     eq(companyUrls.isSelected, true)
  //   ),
  //   columns: {
  //     id: true,
  //     registrationNumber: true,
  //     url: true,
  //   },
  // })
  // console.log(a)
  // console.log(await llm(results))
}

main()
