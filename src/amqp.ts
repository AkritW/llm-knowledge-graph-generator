import * as amqp from "amqplib"

export const publishMessage = async (
  channel: amqp.ConfirmChannel,
  queue: string,
  message: string
) => {
  try {
    return new Promise<void>((resolve, reject) =>
      channel.sendToQueue(
        queue,
        Buffer.from(message),
        {
          persistent: true,
        },
        (err, _) => {
          if (err) {
            reject(err)
          }
          console.log(`Published: ${message}`)
          resolve()
        }
      )
    )
  } catch (error) {
    console.error("Error publishing message:", error)
    throw error
  }
}
