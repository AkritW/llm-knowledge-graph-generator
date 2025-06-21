import OpenAI from "openai"
import { sleep } from "bun"
import { env } from "@src/env"
import { normalizeInput, normalizeJson } from "./utils"
import {
  type LlmInputSchema,
  type LlmOutputSchema,
  llmOutputSchema,
} from "./schema"

const deepseek = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: env.DEEPSEEK_API_KEY,
})

export const SYSTEM_PROMPT = {
  message: `
You are Company Website Analyst AI, designed to extract core information from company websites. Follow these rules meticulously:

You must prioritize quality and accurate data.

Output Requirements:
Return ONLY a markdown code block containing JSON with this structure:
{
  "description": string,  // Never null
  "news": string | null   // Null if no valid news found
}

Processing Rules:
**For Description (Mandatory):**
- Extract what the company does/sells and their core identity
- Format as 2-3 dense paragraphs in English
- Synthesize information from multiple page sections
- Remove marketing fluff while preserving factual claims
- ALWAYS output in English (translate if needed)

**For News (Nullable):**
- Extract recent developments from past ~12 months
- Include undated news if context implies recency
- Format as 1 paragraph max 
- Separate multiple news items with semicolons
- Return NULL if:
  * No news-related content exists
  * All news is explicitly outdated (>12 months)

### Critical Prohibitions
- NEVER use knowledge beyond provided content/URL
- NEVER invent facts - omit uncertain details
- NEVER output placeholders like "N/A"
- NEVER include markdown in JSON values
- NEVER write a description or news in other language other than English

### Error Handling
Return { "errorMessage": "message" } instead of standard JSON ONLY when all url(s) fit the following description:
- Completely unrelated content (e.g., error pages)
- Non-website content (e.g., PDFs, image-only pages)
- Critical contradictions in company identity
`,
  type: "system",
} as const

const reqLlm = (userPrompt: string) =>
  deepseek.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_PROMPT.message },
      { role: "user", content: userPrompt },
    ],
    model: "deepseek-chat",
  })

export const llm = async (payload: LlmInputSchema) => {
  // console.log("Input:", normalizeInput(payload))

  const rawGptOutput = await reqLlm(
    JSON.stringify(normalizeInput(payload), null, 2)
  )
  const contentOutput = rawGptOutput.choices[0]?.message.content

  if (!contentOutput) {
    throw new Error(`GPT Empty Response`)
  }

  let data
  try {
    data = JSON.parse(normalizeJson(contentOutput)) as LlmOutputSchema & {
      errorMessage: string
    }
    if (Array.isArray(data)) {
      data = data[0]
    }
    if (data?.errorMessage) {
      return {
        errorMessage: data.errorMessage as string,
      }
    }
  } catch {
    throw Error(`Failed to parse: ${normalizeJson(contentOutput)}`)
  }

  const result = llmOutputSchema.safeParse(data as LlmOutputSchema)
  if (!result.success) {
    throw Error(
      `Fatal: LLM respond not in expected structured as received ${JSON.stringify(
        data,
        null,
        2
      )}`
    )
  }

  console.log(result.data)

  return result.data
}

export const retry = async <T>(
  fn: () => Promise<T>,
  sleepDuration = 2500,
  retries = 2
): Promise<T> => {
  try {
    return await fn()
  } catch (e) {
    console.error(e)
    if (retries > 0) {
      await sleep(sleepDuration)
      return retry(fn, sleepDuration, retries - 1)
    }
    throw new Error(
      `Maximum retries reached: ${e instanceof Error ? e.message : String(e)}`
    )
  }
}
