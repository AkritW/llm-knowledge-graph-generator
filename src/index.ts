import amqp from "amqplib"
import { env } from "./env"
import { constant } from "./constant"
import { isBalanceOk, isWithinOffPeakPeriod } from "./utils"
import { sleep } from "bun"
import { llmKnowledgeGraphGeneratorSchema } from "./schema"
import { encode } from "gpt-tokenizer"
import { isAlreadyExist, queryCompanyContents } from "./query"
import { llm } from "./llm"
import { insertSummary } from "./insert"

const connection = await amqp.connect(env.RABBITMQ_URL)
const channel = await connection.createConfirmChannel()
await channel.assertQueue(constant.LLM_KNOWLEDGE_GRAPH_GENERATOR_QUEUE)
await channel.prefetch(Number(env.PRE_FETCH))

channel.consume(constant.LLM_KNOWLEDGE_GRAPH_GENERATOR_QUEUE, async (msg) => {
  if (!msg) {
    return
  }

  try {
    if (!isWithinOffPeakPeriod()) {
      console.log("Is not off peak period yet.")
      await sleep(300000)
      channel.nack(msg, false, true)
      return
    }

    if (!(await isBalanceOk())) {
      console.log("No balance available.")
      await sleep(1000 * 60 * 2)
      channel.nack(msg, false, true)
      return
    }

    const message = llmKnowledgeGraphGeneratorSchema.parse(
      JSON.parse(msg.content.toString())
    )

    if (await isAlreadyExist(message.registrationNumber)) {
      console.error(`${message.registrationNumber} is already exist`)
      channel.nack(msg, false, false)
      return
    }

    console.log(`Querying data ${message.registrationNumber}...`)
    const contents = await queryCompanyContents(message.registrationNumber)
    console.log(`Queried data`)

    console.log(`A ${message.registrationNumber}...`)
    const tokens = encode(contents.map((c) => c.content).join("\n\n"))
    if (tokens.length > 50000) {
      console.error(
        `${message.registrationNumber} tokens is over the 50,0000 limit. Found ${tokens.length} tokens`
      )
      channel.nack(msg, false, false)
      return
    }

    const llmResponse = await llm(contents)

    if ("errorMessage" in llmResponse) {
      console.error(
        `${message.registrationNumber}: ${llmResponse.errorMessage}`
      )
      channel.nack(msg, false, false)
      return
    }

    console.log("Inserting...")
    await insertSummary({
      registrationNumber: message.registrationNumber,
      description: llmResponse.description,
      news: llmResponse.news,
    })
    console.log("Inserted")

    channel.ack(msg)
  } catch (err) {
    console.error("-------- Error --------")
    console.error(err)
    channel.nack(msg, false, false)
  }
})
