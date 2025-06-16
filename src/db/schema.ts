import { relations } from "drizzle-orm"
import {
  integer,
  decimal,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  pgEnum,
  boolean,
  index,
} from "drizzle-orm/pg-core"

export const dbdExports = pgTable("dbd_exports", {
  registrationNumber: varchar("registration_number", {
    length: 255,
  }).primaryKey(),
  juristicCompanyName: varchar("juristic_company_name", {
    length: 255,
  }).notNull(),
  juristicCompanyNameEn: varchar("juristic_company_name_en", {
    length: 255,
  }),
  juristicCompanyType: varchar("juristic_company_type", {
    length: 255,
  }).notNull(),
  status: varchar("status", { length: 255 }).notNull(),
  tsicCode: varchar("tsic_code", { length: 255 }).notNull(),
  businessTypeName: varchar("business_type_name", { length: 255 }).notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  registeredCapitalThb: decimal("registered_capital_thb", {
    precision: 18,
    scale: 2,
  }).notNull(),
  totalIncomeThb: decimal("total_income_thb", {
    precision: 18,
    scale: 2,
  }).notNull(),
  netProfitLossThb: decimal("net_profit_loss_thb", {
    precision: 18,
    scale: 2,
  }).notNull(),
  totalAssetsThb: decimal("total_assets_thb", {
    precision: 18,
    scale: 2,
  }).notNull(),
  shareholdersEquityThb: decimal("shareholders_equity_thb", {
    precision: 18,
    scale: 2,
  }).notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const dbdExportRelations = relations(dbdExports, ({ one, many }) => ({
  sector: one(businessSectors, {
    fields: [dbdExports.tsicCode],
    references: [businessSectors.tsicCode],
  }),
  industry: one(businessIndustries, {
    fields: [dbdExports.tsicCode],
    references: [businessIndustries.tsicCode],
  }),
  serps: many(serps),
  extractedSerp: one(extractedSerps, {
    fields: [dbdExports.registrationNumber],
    references: [extractedSerps.registrationNumber],
  }),
  companyUrls: many(companyUrls),
  contents: many(contents),
  emails: many(emails),
  phoneNumbers: many(phoneNumbers),
  summary: one(companySummaries, {
    fields: [dbdExports.registrationNumber],
    references: [companySummaries.registrationNumber],
  }),
}))

export const businessSectors = pgTable("business_sectors", {
  tsicCode: varchar("tsic_code", { length: 255 }).primaryKey(),
  sector: text("sector").notNull(),
})

export const businessSectorRelations = relations(
  businessSectors,
  ({ one }) => ({
    dbdExport: one(dbdExports, {
      fields: [businessSectors.tsicCode],
      references: [dbdExports.tsicCode],
    }),
  })
)

export const businessIndustries = pgTable("business_industries", {
  tsicCode: varchar("tsic_code", { length: 255 }).primaryKey(),
  industry: text("industry").notNull(),
})

export const businessIndustryRelations = relations(
  businessIndustries,
  ({ one }) => ({
    dbdExport: one(dbdExports, {
      fields: [businessIndustries.tsicCode],
      references: [dbdExports.tsicCode],
    }),
  })
)

export const serpType = pgEnum("serp_type", ["juristic_thai", "juristic_en"])

export const serps = pgTable("serps", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  registrationNumber: varchar("registration_number", {
    length: 255,
  })
    .references(() => dbdExports.registrationNumber)
    .notNull(),
  searchTerm: varchar("search_term", { length: 255 }).notNull(),
  type: serpType("type").notNull(),
  serpData: jsonb("serp_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
})

export const serpRelations = relations(serps, ({ one }) => ({
  dbdExport: one(dbdExports, {
    fields: [serps.registrationNumber],
    references: [dbdExports.registrationNumber],
  }),
}))

export const extractedSerps = pgTable("extracted_serps", {
  registrationNumber: varchar("registration_number", {
    length: 255,
  })
    .primaryKey()
    .references(() => dbdExports.registrationNumber),
  companyDomain: text("company_domain"),
  twitter: text("twitter"),
  linkedin: text("linkedin"),
  facebook: text("facebook"),
  instagram: text("instagram"),
  tiktok: text("tiktok"),
  duration: integer("duration").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
})

export const extractedSerpRelations = relations(extractedSerps, ({ one }) => ({
  dbdExport: one(dbdExports, {
    fields: [extractedSerps.registrationNumber],
    references: [dbdExports.registrationNumber],
  }),
}))

export const companyUrls = pgTable(
  "company_urls",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    registrationNumber: varchar("registration_number", {
      length: 255,
    })
      .notNull()
      .references(() => dbdExports.registrationNumber),
    url: text("url"),
    isSelected: boolean("is_selected").notNull().default(false),
    rawHtml: text("raw_html"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("company_urls_url_idx").on(table.url),
    index("company_urls_registration_number_idx").on(table.registrationNumber),
    index("company_urls_registration_number_url_idx").on(
      table.registrationNumber,
      table.url
    ),
  ]
)

export const companyUrlRelations = relations(companyUrls, ({ one }) => ({
  dbdExport: one(dbdExports, {
    fields: [companyUrls.registrationNumber],
    references: [dbdExports.registrationNumber],
  }),
}))

export const contents = pgTable(
  "contents",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    registrationNumber: varchar("registration_number", { length: 255 })
      .references(() => dbdExports.registrationNumber)
      .notNull(),
    content: text("content"),
    urlId: integer("url_id")
      .references(() => companyUrls.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("contents_url_id_idx").on(table.urlId),
    index("contents_registration_number_idx").on(table.registrationNumber),
  ]
)

export const contentRelations = relations(contents, ({ one }) => ({
  dbdExport: one(dbdExports, {
    fields: [contents.registrationNumber],
    references: [dbdExports.registrationNumber],
  }),
  url: one(companyUrls, {
    fields: [contents.urlId],
    references: [companyUrls.id],
  }),
}))

export const emails = pgTable(
  "emails",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    registrationNumber: varchar("registration_number", {
      length: 255,
    })
      .references(() => dbdExports.registrationNumber)
      .notNull(),
    email: text("email").notNull(),
    urlId: integer("url_id")
      .references(() => companyUrls.id)
      .notNull(),
  },
  (table) => [
    index("emails_url_id_idx").on(table.urlId),
    index("emails_registration_number_idx").on(table.registrationNumber),
    index("emails_email_idx").on(table.email),
  ]
)

export const emailRelations = relations(emails, ({ one }) => ({
  dbdExport: one(dbdExports, {
    fields: [emails.registrationNumber],
    references: [dbdExports.registrationNumber],
  }),
  url: one(companyUrls, {
    fields: [emails.urlId],
    references: [companyUrls.id],
  }),
}))

export const phoneNumbers = pgTable(
  "phone_numbers",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    registrationNumber: varchar("registration_number", {
      length: 255,
    })
      .references(() => dbdExports.registrationNumber)
      .notNull(),
    phoneNumber: text("phone_number").notNull(),
    urlId: integer("url_id")
      .references(() => companyUrls.id)
      .notNull(),
  },
  (table) => [
    index("phone_numbers_url_id_idx").on(table.urlId),
    index("phone_numbers_registration_number_idx").on(table.registrationNumber),
    index("phone_numbers_phone_number_idx").on(table.phoneNumber),
  ]
)

export const phoneNumberRelations = relations(phoneNumbers, ({ one }) => ({
  dbdExport: one(dbdExports, {
    fields: [phoneNumbers.registrationNumber],
    references: [dbdExports.registrationNumber],
  }),
  url: one(companyUrls, {
    fields: [phoneNumbers.urlId],
    references: [companyUrls.id],
  }),
}))

export const companySummaries = pgTable("company_summaries", {
  registrationNumber: varchar("registration_number", {
    length: 255,
  })
    .primaryKey()
    .references(() => dbdExports.registrationNumber),
  description: text("description"),
  news: text("news"),
})

export const companySummaryRelations = relations(
  companySummaries,
  ({ one }) => ({
    dbdExport: one(dbdExports, {
      fields: [companySummaries.registrationNumber],
      references: [dbdExports.registrationNumber],
    }),
  })
)
