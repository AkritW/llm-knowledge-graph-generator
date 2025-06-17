import { isNotNull } from "drizzle-orm"
import { db } from "./db"
import { companyUrls } from "./db/schema"
import amqp from "amqplib"
import { constant } from "./constant"
import { env } from "./env"
import { publishMessage } from "./amqp"

const connection = await amqp.connect(env.RABBITMQ_URL)
const channel = await connection.createConfirmChannel()
await channel.assertQueue(constant.LLM_KNOWLEDGE_GRAPH_GENERATOR_QUEUE, {
  durable: true,
})
await channel.prefetch(Number(env.PRE_FETCH))

const a = [
  ...new Set(
    (
      await db.query.companyUrls.findMany({
        where: isNotNull(companyUrls.isSelected),
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

console.log("Publishing...")
await Promise.all(
  c.map((_c) =>
    publishMessage(
      channel,
      constant.LLM_KNOWLEDGE_GRAPH_GENERATOR_QUEUE,
      JSON.stringify({
        registrationNumber: _c,
        timestamp: new Date().toISOString(),
      })
    )
  )
)
console.log(`Published ${c.length} payloads`)

console.log("Closing connections...")
await channel.close()
await connection.close()
console.log("All connections closed")

console.log("Task done.")
