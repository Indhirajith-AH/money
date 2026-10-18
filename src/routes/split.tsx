import { createFileRoute } from "@tanstack/react-router";
import { Split } from "@/components/spend/split";
export const Route = createFileRoute("/split")({
  head: () => ({
    meta: [
      { title: "Split Settlement · QuickSpend" },
      {
        name: "description",
        content: "QuickSpend split settlement — your daily spending, in balance.",
      },
      { property: "og:title", content: "Split Settlement · QuickSpend" },
      {
        property: "og:description",
        content: "QuickSpend split settlement — your daily spending, in balance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Split,
});
