import { createFileRoute } from "@tanstack/react-router";
import { QuickLog } from "@/components/spend/quick-log";
export const Route = createFileRoute("/quick-log")({
  head: () => ({
    meta: [
      { title: "Quick Log · QuickSpend" },
      { name: "description", content: "QuickSpend quick log — your daily spending, in balance." },
      { property: "og:title", content: "Quick Log · QuickSpend" },
      {
        property: "og:description",
        content: "QuickSpend quick log — your daily spending, in balance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuickLog,
});
