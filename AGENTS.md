<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application architecture
- Keep each QuickSpend screen in its own content route and screen module; this preserves independent navigation and page metadata.
- Share preview expenses through the root SpendProvider; entries stay available during navigation without implying a connected storage service.
- Define screen styles through semantic global design tokens and Button variants; this keeps the supplied reference design consistent.
- SpendProvider switches between local demo data (signed out) and Cloud-synced rows (signed in); keeps the app usable without an account.
- AI calls live in `*.server.ts` behind authenticated `createServerFn` wrappers in `*.functions.ts`; keeps the key and prompts server-side.
- Money rules (pace, category budgets, group balances, settle-up) live as pure functions in `src/lib/money.ts` with tests; screens only render them.
- Offline: SpendProvider keeps a per-user localStorage copy and a queue of pending writes flushed on `online`; the service worker is registered only via `src/lib/register-sw.ts` (never in dev/preview).
- Shared groups are owned by one account with named members (friends need no account); balances are derived from entries, never stored.
