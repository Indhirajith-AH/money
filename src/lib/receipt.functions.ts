import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const RECEIPT_CATEGORIES = [
  "Food & Drink",
  "Coffee",
  "Groceries",
  "Transit",
  "Shopping",
  "Bills",
  "Entertainment",
] as const;

const input = z.object({
  image: z.string().startsWith("data:image/").max(8_000_000),
});

export type ReceiptResult = { merchant: string; amount: number; category: string } | { error: string };

export const scanReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data }): Promise<ReceiptResult> => {
    const { readReceipt } = await import("./receipt.server");
    return readReceipt(data.image);
  });
