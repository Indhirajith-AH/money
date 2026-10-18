import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "@/components/spend/settings";
export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · QuickSpend" },
      { name: "description", content: "QuickSpend settings — your daily spending, in balance." },
      { property: "og:title", content: "Settings · QuickSpend" },
      {
        property: "og:description",
        content: "QuickSpend settings — your daily spending, in balance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Settings,
});
