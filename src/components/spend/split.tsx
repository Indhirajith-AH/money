import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon, Modal, Toggle, useSpend } from "@/components/spend-shell";
import { Groups } from "./groups";
type Member = { name: string; detail: string; host?: boolean; allocation: number };
export function Split() {
  const { notify, currency: globalCurrency, currencySymbol: globalSymbol, profile } = useSpend();
  const [total, setTotal] = useState("0.00");
  const [currency, setCurrency] = useState(globalCurrency || "INR");
  const [mode, setMode] = useState("Equal Split");
  const [upi, setUpi] = useState(() => {
    try {
      return localStorage.getItem("qs-upi-id") || "";
    } catch {
      return "";
    }
  });
  const [members, setMembers] = useState<Member[]>([
    { name: "You", detail: upi || "Host", host: true, allocation: 0 },
  ]);
  const [upiDraft, setUpiDraft] = useState(upi);
  const [editUpi, setEditUpi] = useState(false);
  const [add, setAdd] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [deduct, setDeduct] = useState(true);
  const symbols: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ" };
  const symbol = symbols[currency] || globalSymbol || "₹";
  const num = Number(total.replaceAll(",", "")) || 0;
  const equal = members.length > 0 ? num / members.length : 0;
  const share = (m: Member) =>
    mode === "Equal Split"
      ? equal
      : mode === "By % Ratio"
        ? (num * m.allocation) / 100
        : m.allocation;
  const fmt = (n: number) =>
    symbol + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const host = members[0] ?? { name: "You", detail: upi, host: true, allocation: 0 };
  const recipient = members.length > 1 ? members[1]! : host;
  const recipientAmount = share(recipient);
  const link = upi ? `upi://pay?pa=${encodeURIComponent(upi)}&am=${recipientAmount.toFixed(2)}&cu=${currency}` : "";
  const senderName = profile?.display_name || "I";
  const msg = `👋 Hey ${recipient.name.split(" ")[0]}! ${senderName} has split the bill (${fmt(num)} total). Your individual share is ${fmt(recipientAmount)}.${upi ? ` Pay directly via UPI to: ${upi}\nOr tap to pay: ${link}` : ""}`;
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify("Copied successfully");
    } catch {
      notify("Clipboard unavailable in this browser");
    }
  };
  const allocated = members.reduce((s, m) => s + share(m), 0);
  return (
    <main className="page split-page stack">
      <Groups />
      <div className="label uppercase">Quick bill split</div>
      <section className="split-total">
        <div className="row between mb-4">
          <span className="label uppercase">Total Bill Amount</span>
          <select
            className="field small"
            aria-label="Bill currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {Object.entries(symbols).map(([c, s]) => (
              <option value={c} key={c}>
                {c} ({s})
              </option>
            ))}
          </select>
        </div>
        <div className="row justify-center">
          <span className="money mint">{symbol}</span>
          <input
            className="split-amount-input"
            aria-label="Total Bill Amount"
            inputMode="decimal"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            onBlur={() =>
              setTotal(
                num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              )
            }
          />
        </div>
        <div className="row justify-center small muted mt-2">
          <Icon name="groups" />
          Split across {members.length} people ·{" "}
          <strong className="mint">{fmt(equal)} / person</strong>
        </div>
      </section>
      <div className="segments">
        {["Equal Split", "Exact Amounts", "By % Ratio"].map((m) => (
          <Button
            variant="segment"
            key={m}
            aria-pressed={mode === m}
            className="text-xs px-1"
            onClick={() => {
              setMode(m);
              setMembers((a) =>
                a.map((x) => ({ ...x, allocation: m === "By % Ratio" ? 100 / a.length : equal })),
              );
            }}
          >
            {m}
          </Button>
        ))}
      </div>
      <section className="panel">
        <div className="row between">
          <div>
            <h2>Split Breakdown</h2>
            <span className="label">{members.length} Members</span>
          </div>
          <Button variant="action" onClick={() => setAdd(true)}>
            <Icon name="person_add" />
            Add Person
          </Button>
        </div>
        <div className="members">
          {members.map((m, i) => (
            <div className="member" key={i}>
              <div className="member-avatar">
                <Icon name={m.host ? "star" : "person"} />
              </div>
              <div className="grow">
                <div className="strong row">
                  {m.name}
                  {m.host && <span className="badge success">Host (Paid)</span>}
                </div>
                <div className="label">{m.detail}</div>
              </div>
              <div className="member-right">
                {mode === "Equal Split" ? (
                  <div className="mono strong">{fmt(share(m))}</div>
                ) : (
                  <label className="row">
                    <input
                      className="field"
                      type="number"
                      aria-label={`${m.name} ${mode === "By % Ratio" ? "percentage" : "share"}`}
                      min="0"
                      step="0.01"
                      value={m.allocation}
                      onChange={(e) =>
                        setMembers((a) =>
                          a.map((x, j) =>
                            j === i ? { ...x, allocation: Number(e.target.value) } : x,
                          ),
                        )
                      }
                    />
                    <span className="label">{mode === "By % Ratio" ? "%" : symbol}</span>
                  </label>
                )}
                <div className={`label ${m.host ? "mint" : "pink"}`}>
                  {m.host ? "Self Share" : "Pending"}
                </div>
              </div>
            </div>
          ))}
        </div>
        {mode !== "Equal Split" && Math.abs(allocated - num) > 0.02 && (
          <p className="small pink mt-3">
            Allocated {fmt(allocated)} of {fmt(num)}. Adjust shares to match the total.
          </p>
        )}
      </section>
      <section className="panel stack">
        <div className="row between">
          <h2 className="row">
            <Icon name="account_balance_wallet" className="mint" />
            Receiving Destination
          </h2>
          <Button
            variant="action"
            onClick={() => {
              setUpiDraft(upi);
              setEditUpi(true);
            }}
          >
            Edit UPI
          </Button>
        </div>
        <div className="inset-row">
          <div className="label uppercase">Primary VPA / UPI ID</div>
          <div className="row between mt-1">
            <strong className="mono mint upi-id">{upi}</strong>
            <Button
              variant="glyph"
              title="Copy UPI ID"
              aria-label="Copy UPI ID"
              onClick={() => copy(upi)}
            >
              <Icon name="content_copy" />
            </Button>
          </div>
          <div className="row label mt-2">
            <Icon name="phone_iphone" />
            +91 98765 00000<span className="badge">UPI QR</span>
          </div>
        </div>
        <div className="row small muted">
          <Icon name="verified" className="mint" />
          Auto-routes to GPay, PhonePe, Paytm, BHIM{" "}
          <span className="badge success ml-auto">Instant Credit</span>
        </div>
      </section>
      <section className="panel stack">
        <div className="row between">
          <h2 className="row">
            <Icon name="chat" className="mint" />
            Instant WhatsApp Dispatch
          </h2>
          <span className="label mint">Ready to Send</span>
        </div>
        <div className="chat-preview">
          <div className="row between label">
            <span>Recipient Preview ({recipient.name.split(" ")[0]})</span>
            <span>Formatted Deep Link</span>
          </div>
          <div className="chat-bubble">
            👋 Hey <strong>{recipient.name.split(" ")[0]}</strong>! Alex has split the bill for
            “Team Dinner” (<strong>{fmt(num)}</strong> total).
            <br />
            <br />
            👉 Your individual share is <strong>{fmt(recipientAmount)}</strong>.<br />
            Pay directly via UPI to:
            <br />
            <strong className="upi-id">{upi}</strong>
            <br />
            <br />
            Or tap to pay:
            <br />
            <span className="mint upi-id">{link}</span>
            <div className="text-right label mt-2">
              10:42 PM <span className="mint">✓✓</span>
            </div>
          </div>
        </div>
        <Button
          variant="save"
          className="text-base"
          onClick={() =>
            window.open(
              `https://wa.me/?text=${encodeURIComponent(msg)}`,
              "_blank",
              "noopener,noreferrer",
            )
          }
        >
          <Icon name="send" />
          Share Request via WhatsApp
        </Button>
        <div className="action-grid">
          <Button variant="tool" onClick={() => copy(msg)}>
            <Icon name="copy_all" />
            <span className="small">Copy Text &amp; Link</span>
          </Button>
          <Button
            variant="tool"
            onClick={async () => {
              if (navigator.share) {
                try {
                  await navigator.share({ title: "QuickSpend Bill Split", text: msg });
                } catch {}
              } else await copy(msg);
            }}
          >
            <Icon name="share" />
            <span className="small">SMS / Other Apps</span>
          </Button>
        </div>
      </section>
      <section className="panel">
        <div className="setting-row">
          <div>
            <div className="strong">
              Deduct only my personal share <span className="badge success">Smart Sync</span>
            </div>
            <p className="small muted mt-2">
              Deduct <strong className="mint">{fmt(share(host))}</strong> from today's safe spending
              limit instead of full {fmt(num)}.
            </p>
          </div>
          <Toggle
            label="Deduct only my personal share"
            checked={deduct}
            onChange={() => setDeduct(!deduct)}
          />
        </div>
      </section>
      <div className="row small muted">
        <Icon name="speed" className="mint" />
        QuickSpend safely isolates split debts. Incoming settlements will auto-clear member balances
        without skewing your personal monthly telemetry.
      </div>
      {add && (
        <Modal title="Add Person" onClose={() => setAdd(false)}>
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              setMembers((a) => [
                ...a,
                { name, detail: phone, allocation: mode === "By % Ratio" ? 0 : 0 },
              ]);
              setName("");
              setPhone("");
              setAdd(false);
            }}
          >
            <label className="small stack">
              Name
              <input
                className="field"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="small stack">
              Phone
              <input
                className="field"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            <Button type="submit">
              <Icon name="person_add" />
              Add Person
            </Button>
          </form>
        </Modal>
      )}
      {editUpi && (
        <Modal title="Receiving UPI ID" onClose={() => setEditUpi(false)}>
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = upiDraft.trim();
              setUpi(trimmed);
              try {
                localStorage.setItem("qs-upi-id", trimmed);
              } catch {}
              setMembers((a) =>
                a.map((m) => (m.host ? { ...m, detail: trimmed || "Host" } : m)),
              );
              setEditUpi(false);
              notify("UPI ID updated");
            }}
          >
            <label className="small stack">
              UPI ID
              <input
                className="field"
                required
                pattern=".+@.+"
                value={upiDraft}
                onChange={(e) => setUpiDraft(e.target.value)}
              />
            </label>
            <Button type="submit">
              <Icon name="check" />
              Save
            </Button>
          </form>
        </Modal>
      )}
    </main>
  );
}
