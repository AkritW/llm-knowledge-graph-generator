import { z } from "zod"

export type LlmInputSchema = Array<{ url: string; content: string }>

export const llmOutputSchema = z.object({
  description: z.string(),
  news: z.string(),
})
export type LlmOutputSchema = z.infer<typeof llmOutputSchema>
