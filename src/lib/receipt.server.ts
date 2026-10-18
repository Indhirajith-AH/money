import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { RECEIPT_CATEGORIES, type ReceiptResult } from "./receipt.functions";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

export async function readReceipt(image: string): Promise<ReceiptResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { error: "Receipt scanning isn't configured yet." };
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  const mediaType = image.slice(5, image.indexOf(";"));
  const base64 = image.slice(image.indexOf(",") + 1);
  try {
    const result = streamText({
      model: provider.responses(MODEL),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Read this receipt. Reply with ONLY a compact object like " +
                '{"merchant":"Store name","amount":12.5,"category":"Groceries"} — no other text. ' +
                "amount is the final total paid as a number. category must be one of: " +
                RECEIPT_CATEGORIES.join(", ") +
                '. If this is not a receipt, reply {"error":"not a receipt"}.',
            },
            { type: "file", data: base64, mediaType },
          ],
        },
      ],
      providerOptions: {
        openai: {
          store: false,
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    const text = await result.text;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { error: "Couldn't read that receipt." };
    const parsed = JSON.parse(match[0]) as { error?: unknown; amount?: unknown; category?: unknown; merchant?: unknown };
    if (parsed.error) return { error: "That doesn't look like a receipt." };
    const amount = Number(parsed.amount);
    if (!(amount > 0)) return { error: "Couldn't find a total on that receipt." };
    const category = RECEIPT_CATEGORIES.includes(parsed.category as never)
      ? String(parsed.category)
      : "Shopping";
    return { merchant: String(parsed.merchant || "Receipt"), amount: Math.round(amount * 100) / 100, category };
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    console.error("receipt scan failed", status, e);
    if (status === 402) return { error: "AI credits are used up. Add credits in Settings → Plans & credits." };
    if (status === 429) return { error: "Too many scans right now — try again in a minute." };
    return { error: "Receipt scanning failed. Please try again." };
  }
}
