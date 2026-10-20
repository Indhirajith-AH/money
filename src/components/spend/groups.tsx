import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Icon, Modal, useSpend } from "@/components/spend-shell";
import { groupBalances, settleUp, type SplitEntry } from "@/lib/money";

type Group = { id: string; name: string; members: string[] };
type Entry = SplitEntry & { id: string; groupId: string; description: string; createdAt: string };

const demoGroups: Group[] = [];
const demoEntries: Entry[] = [];

export function Groups() {
  const { session, notify, currencySymbol, formatMoney } = useSpend();
  const userId = session?.user.id;
  const [groups, setGroups] = useState<Group[]>(() => {
    try {
      const saved = localStorage.getItem("qs-demo-groups");
      if (saved) return JSON.parse(saved);
    } catch {}
    return demoGroups;
  });
  const [entries, setEntries] = useState<Entry[]>(() => {
    try {
      const saved = localStorage.getItem("qs-demo-entries");
      if (saved) return JSON.parse(saved);
    } catch {}
    return demoEntries;
  });
  const [activeId, setActiveId] = useState(() => groups[0]?.id ?? "");
  const [modal, setModal] = useState<"group" | "expense" | null>(null);
  const [gName, setGName] = useState("");
  const [gMembers, setGMembers] = useState("");
  const [desc, setDesc] = useState("");
  const [amt, setAmt] = useState("");
  const [paidBy, setPaidBy] = useState("You");

  useEffect(() => {
    if (!userId) {
      try {
        const savedG = localStorage.getItem("qs-demo-groups");
        const savedE = localStorage.getItem("qs-demo-entries");
        const gs = savedG ? JSON.parse(savedG) : [];
        setGroups(gs);
        setEntries(savedE ? JSON.parse(savedE) : []);
        setActiveId(gs[0]?.id ?? "");
      } catch {
        setGroups([]);
        setEntries([]);
        setActiveId("");
      }
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
    setEntries((a) => {
      const updated = [local, ...a];
      if (!userId) {
        try {
          localStorage.setItem("qs-demo-entries", JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
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
    setGroups((a) => {
      const updated = [...a, { id, name: gName.trim(), members }];
      if (!userId) {
        try {
          localStorage.setItem("qs-demo-groups", JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
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
        <div className="small muted row">
          <Icon name="devices" />
          Local storage mode — sign in to sync groups across devices
        </div>
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
                    {b !== 0 && formatMoney(Math.abs(b))}
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
                  <strong>{t.from}</strong> → <strong>{t.to}</strong> <span className="mono">{formatMoney(t.amount)}</span>
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
                <span className="mono">{formatMoney(e.amount)}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="p-4 rounded-2xl bg-secondary/30 border border-border/40 text-center stack">
          <div className="icon-disc mx-auto">
            <Icon name="group_off" className="muted" />
          </div>
          <div className="strong">No split groups yet</div>
          <p className="small muted">Create a group to start tracking shared expenses with friends.</p>
          <div>
            <Button variant="action" onClick={() => setModal("group")}>
              <Icon name="group_add" /> Create First Group
            </Button>
          </div>
        </div>
      )}
      {modal === "group" && (
        <Modal title="New group" onClose={() => setModal(null)}>
          <form className="stack" onSubmit={(e) => { e.preventDefault(); createGroup(); }}>
            <label className="stack small">
              Group name
              <input className="field" required placeholder="e.g. Goa Trip, Flatmates" value={gName} onChange={(e) => setGName(e.target.value)} />
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
              <input className="field" placeholder="Dinner, cab, groceries..." value={desc} onChange={(e) => setDesc(e.target.value)} />
            </label>
            <label className="stack small">
              Amount ({currencySymbol})
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
