import { and, eq } from "drizzle-orm"
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
  const results = await queryCompanyContents("")

  console.log(await llm(results))
}

main()
