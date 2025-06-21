import ExcelJS from "exceljs"
import { pgTable, varchar, text } from "drizzle-orm/pg-core"
import { Pool } from "pg"
import * as fs from "fs"
import { companySummaries, companyUrls, dbdExports } from "./db/schema"
import { db } from "./db"
import { and, eq, inArray, isNotNull } from "drizzle-orm"

const findMissing = async () => {
  const a = [
    ...new Set(
      (
        await db.query.companyUrls.findMany({
          where: and(
            eq(companyUrls.isSelected, true),
            isNotNull(companyUrls.rawHtml)
          ),
          columns: { registrationNumber: true },
        })
      ).map((_) => _.registrationNumber)
    ),
  ]
  console.log(`a length: ${a.length}`)

  const b = new Set(
    (
      await db.query.companySummaries.findMany({
        columns: { registrationNumber: true },
      })
    ).map((_) => _.registrationNumber)
  )
  console.log(`b length: ${b.size}`)

  const c = a.filter((_a) => !b.has(_a))
  console.log("c length:", c.length)

  return c
}

async function exportToExcel() {
  const missingRegistrationNumbers = await findMissing()

  const partialDatas = await db.query.dbdExports.findMany({
    where: inArray(dbdExports.registrationNumber, missingRegistrationNumbers),
    columns: { registrationNumber: true },
    with: {
      extractedSerp: { columns: { companyDomain: true } },
    },
  })
  const preParsedDatas = await Promise.all(
    partialDatas.map(async (partialData) => ({
      ...partialData,
      urls: await db.query.companyUrls.findMany({
        where: and(
          eq(companyUrls.registrationNumber, partialData.registrationNumber),
          eq(companyUrls.isSelected, true)
        ),
        columns: { url: true },
      }),
    }))
  )
  const data = preParsedDatas.map((preParsedData) => ({
    registrationNumber: preParsedData.registrationNumber,
    domain: preParsedData.extractedSerp.companyDomain,
    urls: preParsedData.urls.map((_) => _.url),
  }))

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet("Company Summaries")

  worksheet.columns = [
    { header: "Registration Number", key: "registrationNumber", width: 30 },
    { header: "Domain", key: "domain", width: 30 },
    { header: "Url1", key: "url1", width: 30 },
    { header: "Url2", key: "url2", width: 30 },
    { header: "Url3", key: "url3", width: 30 },
    { header: "Url4", key: "url4", width: 30 },
    { header: "Url5", key: "url5", width: 30 },
    { header: "Description", key: "description", width: 50 },
    { header: "News", key: "news", width: 50 },
  ]

  data.forEach((record) => {
    worksheet.addRow({
      registrationNumber: record.registrationNumber,
      domain: record.domain,
      url1: record.urls[0],
      url2: record.urls[1],
      url3: record.urls[2],
      url4: record.urls[3],
      url5: record.urls[4],
      description: undefined,
      news: undefined,
    })
  })

  const filename = `company-summaries-missing.xlsx`

  await workbook.xlsx.writeFile(filename)
  console.log(`Exported ${data.length} records to ${filename}`)
}

exportToExcel().catch(console.error)
