import { z } from "zod"

export const llmKnowledgeGraphGeneratorSchema = z.object({
  registrationNumber: z.string(),
  timestamp: z.string(),
})
export type LlmKnowledgeGraphGeneratorSchema = z.infer<
  typeof llmKnowledgeGraphGeneratorSchema
>
