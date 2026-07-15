type TelegramRecipientKey = "HSE" | "HR" | "SECURITY";

interface TelegramConfig {
  token: string;
  chatId: string;
}

const TELEGRAM_CONFIGS: Record<TelegramRecipientKey, TelegramConfig> = {
  HSE: {
    token:  process.env.TELEGRAM_BOT_TOKEN_HSE!,
    chatId: process.env.TELEGRAM_HSE_CHAT_ID!,
  },
  HR: {
    token:  process.env.TELEGRAM_BOT_TOKEN_HR!,
    chatId: process.env.TELEGRAM_HR_CHAT_ID!,
  },
  SECURITY: {
    token:  process.env.TELEGRAM_BOT_TOKEN_SECURITY!,
    chatId: process.env.TELEGRAM_SECURITY_CHAT_ID!,
  },
};

export async function sendTelegramMessage(
  recipient: TelegramRecipientKey,
  message: string,
): Promise<void> {
  const { token, chatId } = TELEGRAM_CONFIGS[recipient];

  if (!token)  throw new Error(`TELEGRAM_BOT_TOKEN_${recipient} is not set`);
  if (!chatId) throw new Error(`TELEGRAM_${recipient}_CHAT_ID is not set`);

  const res = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id:    chatId,
        text:       message,
        parse_mode: "HTML",
      }),
    },
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.description ?? "Failed to send Telegram message");
  }
}
