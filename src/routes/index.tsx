import { createFileRoute } from "@tanstack/react-router";
import { Today } from "@/components/spend/today";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today · QuickSpend" },
      { name: "description", content: "QuickSpend today — your daily spending, in balance." },
      { property: "og:title", content: "Today · QuickSpend" },
      {
        property: "og:description",
        content: "QuickSpend today — your daily spending, in balance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Today,
});
