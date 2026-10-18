import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon, useSpend } from "@/components/spend-shell";

const steps = [
  { icon: "ios_share", title: "Add QuickSpend to Home Screen", text: "In Safari tap Share → Add to Home Screen. This makes Quick Log open full-screen like an app." },
  { icon: "apps", title: "Open the Shortcuts app", text: "Tap + to create a new shortcut and name it “Quick Log”." },
  { icon: "link", title: "Add the “Open URLs” action", text: "Search for Open URLs and paste the Quick Log link copied below." },
  { icon: "settings", title: "Turn on Back Tap", text: "Settings → Accessibility → Touch → Back Tap → Double Tap → pick “Quick Log”." },
  { icon: "touch_app", title: "Double-tap the back of your iPhone", text: "Quick Log opens instantly, ready for the amount." },
];

export function IphoneShortcut() {
  const { notify } = useSpend();
  const [url, setUrl] = useState("/quick-log");
  const [isIos, setIsIos] = useState(false);
  useEffect(() => {
    setUrl(`${window.location.origin}/quick-log`);
    setIsIos(/iPhone|iPad|iPod/.test(navigator.userAgent));
  }, []);
  const copy = async () => {
    await navigator.clipboard.writeText(url);
    notify("Quick Log link copied");
  };
  return (
    <section className="panel stack">
      <div className="section-head">
        <div className="row">
          <Icon name="phone_iphone" className="mint" />
          <h2>iPhone Double-Tap Shortcut</h2>
        </div>
        <span className="label mint">{isIos ? "iPhone detected" : "iOS 14+"}</span>
      </div>
      <div className="small muted">Double-tap the back of your iPhone to jump straight into Quick Log.</div>
      <div className="field small" style={{ wordBreak: "break-all" }}>{url}</div>
      <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
        <Button variant="action" onClick={() => void copy()}>
          <Icon name="content_copy" /> Copy Quick Log link
        </Button>
        {isIos && (
          <Button variant="action" onClick={() => (window.location.href = "shortcuts://create-shortcut")}>
            <Icon name="open_in_new" /> Open Shortcuts
          </Button>
        )}
      </div>
      <ol className="stack" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {steps.map((s, i) => (
          <li key={s.title} className="setting-row">
            <div className="row">
              <div className="icon-disc">
                <Icon name={s.icon} />
              </div>
              <div>
                <div className="strong">
                  {i + 1}. {s.title}
                </div>
                <div className="small muted">{s.text}</div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
