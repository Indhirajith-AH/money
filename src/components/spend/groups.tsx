import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Icon, Modal, useSpend } from "@/components/spend-shell";
import { groupBalances, settleUp, type SplitEntry } from "@/lib/money";

type Group = { id: string; name: string; members: string[] };
type Entry = SplitEntry & { id: string; groupId: string; description: string; createdAt: string };

const demoGroups: Group[] = [{ id: "demo", name: "Goa Trip", members: ["You", "Rahul", "Ananya"] }];
const demoEntries: Entry[] = [
  { id: "d1", groupId: "demo", kind: "expense", description: "Beach shack dinner", amount: 3600, paidBy: "You", splitAmong: [], createdAt: new Date().toISOString() },
  { id: "d2", groupId: "demo", kind: "expense", description: "Scooter rental", amount: 1500, paidBy: "Rahul", splitAmong: [], createdAt: new Date().toISOString() },
];
const money = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function Groups() {
  const { session, notify } = useSpend();
  const userId = session?.user.id;
  const [groups, setGroups] = useState<Group[]>(demoGroups);
  const [entries, setEntries] = useState<Entry[]>(demoEntries);
  const [activeId, setActiveId] = useState("demo");
  const [modal, setModal] = useState<"group" | "expense" | null>(null);
  const [gName, setGName] = useState("");
  const [gMembers, setGMembers] = useState("");
  const [desc, setDesc] = useState("");
  const [amt, setAmt] = useState("");
  const [paidBy, setPaidBy] = useState("You");

  useEffect(() => {
    if (!userId) {
      setGroups(demoGroups);
      setEntries(demoEntries);
      setActiveId("demo");
      return;
    }
    (async () => {
      const [{ data: g }, { data: e }] = await Promise.all([
        supabase.from("split_groups").select("id,name,members").order("created_at"),
        supabase.from("split_entries").select("*").order("created_at", { ascending: false }),
      ]);
      const gs = g ?? [];
      setGroups(gs);
      setEntries(
        (e ?? []).map((r) => ({
          id: r.id,
          groupId: r.group_id,
          kind: r.kind as Entry["kind"],
          description: r.description,
          amount: Number(r.amount),
          paidBy: r.paid_by,
          splitAmong: r.split_among,
          createdAt: r.created_at,
        })),
      );
      setActiveId(gs[0]?.id ?? "");
    })();
  }, [userId]);

  const group = groups.find((g) => g.id === activeId);
  const gEntries = entries.filter((e) => e.groupId === activeId);
  const balances = group ? groupBalances(group.members, gEntries) : {};
  const transfers = settleUp(balances);

  const addEntry = async (e: Omit<Entry, "id" | "createdAt">) => {
    const local: Entry = { ...e, id: "tmp-" + Date.now(), createdAt: new Date().toISOString() };
    if (userId && e.groupId !== "demo") {
      const { data, error } = await supabase
        .from("split_entries")
        .insert({ group_id: e.groupId, user_id: userId, kind: e.kind, description: e.description, amount: e.amount, paid_by: e.paidBy, split_among: e.splitAmong })
        .select("id")
        .single();
      if (error || !data) return notify("Couldn't save — try again");
      local.id = data.id;
    }
    setEntries((a) => [local, ...a]);
  };

  const createGroup = async () => {
    const members = ["You", ...gMembers.split(",").map((s) => s.trim()).filter(Boolean)];
    if (!gName.trim() || members.length < 2) return notify("Add a name and at least one friend");
    let id = "local-" + Date.now();
    if (userId) {
      const { data, error } = await supabase.from("split_groups").insert({ user_id: userId, name: gName.trim(), members }).select("id").single();
      if (error || !data) return notify("Couldn't create group");
      id = data.id;
    }
    setGroups((a) => [...a, { id, name: gName.trim(), members }]);
    setActiveId(id);
    setModal(null);
    setGName("");
    setGMembers("");
    notify("Group created");
  };

  return (
    <section className="panel stack">
      <div className="row between">
        <div>
          <h2>Shared Groups</h2>
          <span className="label">Balances &amp; settle-up</span>
        </div>
        <Button variant="action" onClick={() => setModal("group")}>
          <Icon name="group_add" />
          New group
        </Button>
      </div>
      {!userId && (
        <a href="/auth" className="small muted">
          <Icon name="cloud" /> Sample group — sign in to save your own groups
        </a>
      )}
      {groups.length > 0 && (
        <div className="rail">
          {groups.map((g) => (
            <Button key={g.id} variant="pill" aria-pressed={g.id === activeId} onClick={() => setActiveId(g.id)}>
              <Icon name="groups" />
              {g.name}
            </Button>
          ))}
        </div>
      )}
      {group ? (
        <>
          <div className="members">
            {group.members.map((m) => {
              const b = balances[m] ?? 0;
              return (
                <div className="member" key={m}>
                  <div className="member-avatar">
                    <Icon name={m === "You" ? "star" : "person"} />
                  </div>
                  <div className="grow strong">{m}</div>
                  <div className={`mono strong ${b > 0 ? "mint" : b < 0 ? "pink" : "muted"}`}>
                    {b > 0 ? "gets " : b < 0 ? "owes " : "settled"}
                    {b !== 0 && money(Math.abs(b))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="label uppercase">Settle up</div>
          {transfers.length === 0 ? (
            <p className="small mint">
              <Icon name="verified" /> Everyone is square.
            </p>
          ) : (
            transfers.map((t) => (
              <div className="row between settle-row" key={t.from + t.to}>
                <span className="small">
                  <strong>{t.from}</strong> → <strong>{t.to}</strong> <span className="mono">{money(t.amount)}</span>
                </span>
                <Button
                  variant="tool"
                  size="sm"
                  onClick={async () => {
                    await addEntry({ groupId: group.id, kind: "settle", description: `${t.from} paid ${t.to}`, amount: t.amount, paidBy: t.from, splitAmong: [t.to] });
                    notify("Marked as settled");
                  }}
                >
                  Mark paid
                </Button>
              </div>
            ))
          )}
          <Button variant="action" onClick={() => setModal("expense")}>
            <Icon name="add" />
            Add group expense
          </Button>
          <div className="stack">
            {gEntries.slice(0, 8).map((e) => (
              <div className="row between small" key={e.id}>
                <span>
                  <Icon name={e.kind === "settle" ? "handshake" : "receipt_long"} className="muted" /> {e.description || "Expense"} · {e.paidBy}
                </span>
                <span className="mono">{money(e.amount)}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="small muted">Create a group to start tracking who owes whom.</p>
      )}
      {modal === "group" && (
        <Modal title="New group" onClose={() => setModal(null)}>
          <form className="stack" onSubmit={(e) => { e.preventDefault(); createGroup(); }}>
            <label className="stack small">
              Group name
              <input className="field" required value={gName} onChange={(e) => setGName(e.target.value)} />
            </label>
            <label className="stack small">
              Friends (comma separated)
              <input className="field" placeholder="Rahul, Ananya" value={gMembers} onChange={(e) => setGMembers(e.target.value)} />
            </label>
            <Button type="submit">Create group</Button>
          </form>
        </Modal>
      )}
      {modal === "expense" && group && (
        <Modal title={`Add to ${group.name}`} onClose={() => setModal(null)}>
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const n = Number(amt);
              if (!(n > 0)) return notify("Enter an amount above zero");
              await addEntry({ groupId: group.id, kind: "expense", description: desc, amount: n, paidBy, splitAmong: [] });
              setModal(null);
              setDesc("");
              setAmt("");
              notify("Split equally across the group");
            }}
          >
            <label className="stack small">
              What for
              <input className="field" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </label>
            <label className="stack small">
              Amount (₹)
              <input className="field" type="number" min="0.01" step="0.01" required value={amt} onChange={(e) => setAmt(e.target.value)} />
            </label>
            <label className="stack small">
              Paid by
              <select className="field" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
                {group.members.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
            <Button type="submit">Save</Button>
          </form>
        </Modal>
      )}
    </section>
  );
}
