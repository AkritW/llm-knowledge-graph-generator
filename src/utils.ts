import { env } from "./env"

interface BalanceResponse {
  is_available: boolean
  balance_infos: Array<{
    currency: string
    total_balance: string
    granted_balance: string
    topped_up_balance: string
  }>
}

export const isBalanceOk = async () => {
  try {
    const balRes = await fetch("https://api.deepseek.com/user/balance", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      },
    })
    if (!balRes.ok) {
      return false
    }
    const bal = (await balRes.json()) as BalanceResponse
    if (!bal.is_available) {
      return false
    }

    return true
  } catch (e) {
    console.error(e)

    return false
  }
}

const CONSUMPTION_START_TIME = { hour: 16, minute: 35 }
const CONSUMPTION_END_TIME = { hour: 0, minute: 25 }

// DeepSeek API provides off-peak pricing discounts during 16:30-00:30 UTC each day.
export const isWithinOffPeakPeriod = () => {
  const now = new Date()
  const currentHour = now.getUTCHours()
  const currentMinute = now.getUTCMinutes()

  const currentTimeInMinutes = currentHour * 60 + currentMinute
  const startTimeInMinutes =
    CONSUMPTION_START_TIME.hour * 60 + CONSUMPTION_START_TIME.minute
  const endTimeInMinutes =
    CONSUMPTION_END_TIME.hour * 60 + CONSUMPTION_END_TIME.minute

  // Handle overnight window (e.g., 16:35–00:25)
  if (startTimeInMinutes > endTimeInMinutes) {
    return (
      currentTimeInMinutes >= startTimeInMinutes || // After 16:35
      currentTimeInMinutes <= endTimeInMinutes // Before 00:25
    )
  } else {
    return (
      currentTimeInMinutes >= startTimeInMinutes &&
      currentTimeInMinutes <= endTimeInMinutes
    )
  }
}
