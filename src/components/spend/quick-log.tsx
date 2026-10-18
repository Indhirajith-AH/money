import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { scanReceipt } from "@/lib/receipt.functions";
import { Button } from "@/components/ui/button";
import { Icon, useSpend } from "@/components/spend-shell";
const cats = [
  ["Food & Drink", "restaurant"],
  ["Coffee", "local_cafe"],
  ["Groceries", "shopping_cart"],
  ["Transit", "directions_subway"],
  ["Shopping", "shopping_bag"],
  ["Bills", "receipt_long"],
  ["Entertainment", "movie"],
] as const;
export function QuickLog() {
  const { remaining, addExpense, notify, session } = useSpend();
  const scan = useServerFn(scanReceipt);
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const onReceipt = async (file?: File) => {
    if (!file) return;
    if (file.size > 5_000_000) return notify("Photo is too large (max 5 MB)");
    setScanning(true);
    try {
      const image = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const out = await scan({ data: { image } });
      if ("error" in out) notify(out.error);
      else {
        setAmount(out.amount.toFixed(2));
        setReplace(true);
        setCategory(out.category);
        setNote(out.merchant);
        notify("Receipt read — check and save");
      }
    } catch {
      notify("Receipt scanning failed");
    } finally {
      setScanning(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  const [amount, setAmount] = useState("12.50");
  const [replace, setReplace] = useState(true);
  const [category, setCategory] = useState("Food & Drink");
  const [note, setNote] = useState("");
  const input = (key: string) => {
    if (key === "backspace") {
      setAmount((v) => v.slice(0, -1));
      setReplace(false);
      return;
    }
    if (replace) {
      setAmount(key === "." ? "0." : key);
      setReplace(false);
      return;
    }
    setAmount((v) => {
      if (key === ".") return v.includes(".") ? v : (v || "0") + ".";
      if (v.length >= 8 || (v.split(".")[1]?.length ?? 0) >= 2) return v;
      return v === "0" ? key : v + key;
    });
  };
  const num = Number(amount) || 0;
  return (
    <main className="page quick-page">
      <div className="drag-handle" />
      <div className="row between quick-meta">
        <div className="row label uppercase">
          <Icon name="bolt" className="mint" />
          Instant Quick-Add
        </div>
        <div className="badge row">
          <i className="dot" />
          <span>Left today:</span>
          <strong className="mint">${remaining.toFixed(2)}</strong>
        </div>
      </div>
      <div className="amount-display">
        <div className="money">
          <span className="mint">$ </span>
          {amount || "0.00"}
          <span className="cursor" />
        </div>
        <div className="row justify-center mt-3 label">
          <Icon name="trending_down" className="pink" />
          Post-expense:{" "}
          <strong className={remaining - num < 0 ? "pink" : ""}>
            {remaining - num < 0 ? "-" : ""}${Math.abs(remaining - num).toFixed(2)}
          </strong>
        </div>
      </div>
      <div className="row between">
        <span className="label uppercase">Category</span>
        <span className="label mint">{category}</span>
      </div>
      <div className="rail">
        {cats.map(([c, i]) => (
          <Button
            key={c}
            variant="pill"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
          >
            <Icon name={i} />
            {c}
          </Button>
        ))}
      </div>
      <div className="note-row">
        <Icon name="edit_note" className="muted" />
        <input
          aria-label="Expense note"
          placeholder="Add a note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <div className="tags">
        {["lunch", "commute", "work", "coffee", "snack"].map((t) => (
          <Button
            key={t}
            variant="pill"
            size="sm"
            onClick={() => setNote((v) => (v.includes("#" + t) ? v : `${v} #${t}`.trim()))}
          >
            #{t}
          </Button>
        ))}
      </div>
      {session ? (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            aria-label="Receipt photo"
            onChange={(e) => onReceipt(e.target.files?.[0])}
          />
          <Button variant="action" disabled={scanning} onClick={() => fileRef.current?.click()}>
            <Icon name={scanning ? "hourglass_top" : "document_scanner"} />
            {scanning ? "Reading receipt…" : "Scan receipt with AI"}
          </Button>
        </>
      ) : (
        <Link to="/auth" className="small muted text-center">
          <Icon name="document_scanner" /> Sign in to scan receipts with AI
        </Link>
      )}
      <div className="keypad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "backspace"].map((k) => (
          <Button
            key={k}
            variant="keypad"
            aria-label={k === "backspace" ? "Backspace" : k}
            onClick={() => input(k)}
          >
            {k === "backspace" ? <Icon name="backspace" /> : k}
          </Button>
        ))}
      </div>
      <Button
        variant="save"
        onClick={() => {
          if (num <= 0) {
            notify("Enter an amount above zero");
            return;
          }
          addExpense({
            name: note || category,
            amount: num,
            category,
            icon: cats.find((c) => c[0] === category)?.[1] ?? "receipt_long",
          });
          setAmount("");
          setNote("");
          setReplace(true);
        }}
      >
        <Icon name="check_circle" />
        Save in 1-Tap <span className="label text-primary-foreground">⚡ Instant</span>
      </Button>
    </main>
  );
}
