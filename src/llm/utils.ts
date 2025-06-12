import type { LlmInputSchema } from "./schema"
import { toUnicode } from "punycode"

export const normalizeJson = (jsonOrJsonMarkdown: string) => {
  const jsonBlockMatch = jsonOrJsonMarkdown.match(/```json\n([\s\S]+?)\n```/)
  if (jsonBlockMatch?.[1]) return jsonBlockMatch[1].trim()

  const genericBlockMatch = jsonOrJsonMarkdown.match(/```\n([\s\S]+?)\n```/)
  if (genericBlockMatch?.[1]) return genericBlockMatch[1].trim()

  const jsonMatch = jsonOrJsonMarkdown.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
  if (jsonMatch?.[0]) return jsonMatch[0].trim()

  return jsonOrJsonMarkdown.trim()
}

export const normalizeInput = (llmInput: LlmInputSchema) =>
  llmInput.map((l) => decodeEntireUrl(l.url) + "\n" + l.content).join("\n\n\n")

export const decodeEntireUrl = (url: string) => {
  try {
    const u = new URL(url)

    const decoded = {
      protocol: u.protocol,
      hostname: toUnicode(u.hostname),
      pathname: decodeURIComponent(u.pathname),
      search: decodeURIComponent(u.search),
      hash: decodeURIComponent(u.hash),
    }

    return `${decoded.protocol}//${decoded.hostname}${decoded.pathname}${decoded.search}${decoded.hash}`
  } catch (e) {
    return url
  }
}
