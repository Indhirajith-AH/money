import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon, useSpend } from "@/components/spend-shell";

const steps = [
  { icon: "apps", title: "Open the Shortcuts app", text: "Tap + to create a new shortcut and name it “Quick Log”." },
  { icon: "web", title: "Add the “Show Web View” action", text: "Search for “Show Web View” (or “Show Web Page”, NOT “Open URLs”). Paste the Quick Log link copied below. This makes it pop up as a floating card without opening Safari!" },
  { icon: "settings", title: "Turn on Back Tap", text: "Settings → Accessibility → Touch → Back Tap → Double Tap → pick “Quick Log”." },
  { icon: "touch_app", title: "Double-tap the back of your iPhone", text: "A floating pop-up card appears instantly over your screen, ready to log and auto-dismiss." },
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
