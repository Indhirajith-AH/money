import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Icon, useSpend } from "@/components/spend-shell";

const KEY = "qs-my-upi";

export function ReceivePay() {
  const { notify, profile } = useSpend();
  const [upi, setUpi] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [qr, setQr] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
      setUpi(saved.upi || "");
      setName(saved.name || profile?.display_name || "");
    } catch {
      /* ignore */
    }
  }, [profile?.display_name]);

  const valid = /^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upi.trim());
  const amt = parseFloat(amount);
  const link = valid
    ? `upi://pay?pa=${encodeURIComponent(upi.trim())}${name ? `&pn=${encodeURIComponent(name)}` : ""}${amt > 0 ? `&am=${amt.toFixed(2)}` : ""}&cu=INR`
    : "";

  useEffect(() => {
    if (!link) return setQr("");
    QRCode.toDataURL(link, { width: 480, margin: 2 }).then(setQr).catch(() => setQr(""));
  }, [link]);

  const save = () => {
    localStorage.setItem(KEY, JSON.stringify({ upi: upi.trim(), name }));
    notify("Payment details saved");
  };

  const text = `Pay ${name || "me"}${amt > 0 ? ` ₹${amt.toFixed(2)}` : ""} via UPI: ${upi.trim()}\n${link}`;

  const shareQr = async () => {
    if (!qr) return;
    const blob = await (await fetch(qr)).blob();
    const file = new File([blob], "my-upi-qr.png", { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: "My UPI QR", text });
      } catch {
        /* cancelled */
      }
      return;
    }
    const a = document.createElement("a");
    a.href = qr;
    a.download = "my-upi-qr.png";
    a.click();
    notify("QR image downloaded");
  };

  const shareId = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "My UPI ID", text });
        return;
      } catch {
        return;
      }
    }
    await navigator.clipboard.writeText(text);
    notify("UPI details copied");
  };

  return (
    <section className="panel stack">
      <div className="section-head">
        <div className="row">
          <Icon name="qr_code_2" className="mint" />
          <h2>Receive Money</h2>
        </div>
        <span className="label mint">{valid ? "Ready" : "Setup"}</span>
      </div>
      <label className="stack">
        <span className="label uppercase">Your UPI ID</span>
        <input className="field" value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="name@okbank" />
      </label>
      <label className="stack">
        <span className="label uppercase">Name shown to payer</span>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
      </label>
      <label className="stack">
        <span className="label uppercase">Amount (optional, ₹)</span>
        <input className="field" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} placeholder="Any amount" />
      </label>
      {qr ? (
        <div className="stack" style={{ alignItems: "center" }}>
          <img src={qr} alt="Your UPI payment QR code" width={220} height={220} style={{ borderRadius: 12 }} />
          <div className="small muted">Anyone can scan this with GPay, PhonePe or Paytm</div>
        </div>
      ) : (
        <div className="small muted">Enter a valid UPI ID to generate your QR code.</div>
      )}
      <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
        <Button variant="action" onClick={save} disabled={!valid}>
          <Icon name="save" /> Save
        </Button>
        <Button variant="action" onClick={() => void shareQr()} disabled={!qr}>
          <Icon name="share" /> Share QR
        </Button>
        <Button variant="action" onClick={() => void shareId()} disabled={!valid}>
          <Icon name="send" /> Share UPI ID
        </Button>
        <Button variant="action" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")} disabled={!valid}>
          <Icon name="chat" /> WhatsApp
        </Button>
      </div>
    </section>
  );
}
