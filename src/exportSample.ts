import ExcelJS from "exceljs"
import { db } from "./db"
import { companySummaries, companyUrls, dbdExports } from "./db/schema"
import { and, eq, inArray, sql } from "drizzle-orm"

async function exportSampleToExcel() {
  const sampleData = await db.query.companySummaries.findMany({
    limit: 200,
    orderBy: sql`random()`,
  })

  const excelData = sampleData.map((record) => ({
    registrationNumber: record.registrationNumber,
    description: record.description,
    news: record.news || "",
  }))

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet("Company Samples")

  worksheet.columns = [
    { header: "Registration Number", key: "registrationNumber", width: 30 },
    { header: "Description", key: "description", width: 50 },
    { header: "News", key: "news", width: 50 },
  ]

  excelData.forEach((record) => {
    const rowData: Record<string, any> = {
      registrationNumber: record.registrationNumber,
      description: record.description,
      news: record.news,
    }

    worksheet.addRow(rowData)
  })

  const filename = `company-summaries-sample.xlsx`

  await workbook.xlsx.writeFile(filename)
  console.log(`Exported ${excelData.length} sample records to ${filename}`)
}

exportSampleToExcel().catch(console.error)
