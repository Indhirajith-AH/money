import { createFileRoute } from "@tanstack/react-router";
import { Analytics } from "@/components/spend/analytics";
export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics · QuickSpend" },
      { name: "description", content: "QuickSpend analytics — your daily spending, in balance." },
      { property: "og:title", content: "Analytics · QuickSpend" },
      {
        property: "og:description",
        content: "QuickSpend analytics — your daily spending, in balance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Analytics,
});
