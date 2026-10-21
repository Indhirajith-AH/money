import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon, useSpend } from "@/components/spend-shell";

const steps = [
  {
    icon: "keyboard_command_key",
    title: "Open Shortcuts on Mac",
    text: "Press ⌘Space, type Shortcuts, hit Return. Create a new shortcut named “Quick Log”.",
  },
  {
    icon: "link",
    title: "Add “Get Contents of URL” action",
    text: "Paste the Quick Log link below. Set method to GET. Enable “Show in Menu Bar” and “Show in Services Menu”.",
  },
  {
    icon: "settings",
    title: "Assign a global hotkey",
    text: "Shortcut settings → Keyboard Shortcut → press ⌥⌘L (or your choice). Works system-wide.",
  },
  {
    icon: "mic",
    title: "Add Siri phrase",
    text: "Shortcut settings → Add to Siri → record “Log expense” or “Quick spend”.",
  },
  {
    icon: "touch_app",
    title: "Trigger anywhere",
    text: "Press ⌥⌘L, click the Menu Bar icon, ask Siri, or right-click any text → Services → Quick Log.",
  },
];

export function MacOSShortcut() {
  const { notify, session } = useSpend();
  const [url, setUrl] = useState("/quick-log");
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    const syncToken = session?.refresh_token ? `#sync_token=${encodeURIComponent(session.refresh_token)}` : "";
    setUrl(`${window.location.origin}/quick-log${syncToken}`);
    setIsMac(
      /Mac|iPhone|iPad|iPod/.test(navigator.userAgent) &&
        !/iPhone|iPad|iPod/.test(navigator.userAgent),
    );
  }, [session]);
  const copy = async () => {
    await navigator.clipboard.writeText(url);
    notify(session ? "Quick Log link copied with your account sync!" : "Quick Log link copied");
  };
  const openShortcuts = () => {
    window.location.href = "shortcuts://";
  };
  return (
    <section className="panel stack">
      <div className="section-head">
        <div className="row">
          <Icon name="computer" className="mint" />
          <h2>macOS Menu Bar & Siri</h2>
        </div>
        <span className="label mint">{isMac ? "Mac detected" : "macOS 12+"}</span>
      </div>
      <div className="small muted">
        Global hotkey, Menu Bar icon, Siri voice, and Services menu — all from one Shortcut.
      </div>
      <div className="field small" style={{ wordBreak: "break-all" }}>
        {url}
      </div>
      <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
        <Button variant="action" onClick={() => void copy()}>
          <Icon name="content_copy" /> Copy Quick Log link
        </Button>
        {isMac && (
          <Button variant="action" onClick={openShortcuts}>
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
      <div className="panel stack mt-3">
        <div className="row between">
          <div>
            <h3>Menu Bar Preview</h3>
            <p className="small muted">Enable “Show in Menu Bar” in the shortcut to get this</p>
          </div>
          <Icon name="keyboard_arrow_down" className="muted" />
        </div>
        <div className="shade">
          <div className="menubar-preview">
            <div className="menubar-item">
              <Icon name="bolt" className="mint" />
              <span>QuickSpend</span>
            </div>
            <div className="menubar-divider" />
            <div className="menubar-item">
              <Icon name="add_circle" />
              <span>Log Expense…</span>
              <kbd>⌥⌘L</kbd>
            </div>
            <div className="menubar-item">
              <Icon name="dashboard" />
              <span>Open Dashboard</span>
            </div>
            <div className="menubar-item">
              <Icon name="insights" />
              <span>Today's Analytics</span>
            </div>
            <div className="menubar-divider" />
            <div className="menubar-item">
              <Icon name="settings" />
              <span>Settings</span>
            </div>
            <div className="menubar-item">
              <Icon name="logout" />
              <span>Quit</span>
              <kbd>⌘Q</kbd>
            </div>
          </div>
        </div>
      </div>
      <div className="panel stack mt-3">
        <div className="row between">
          <div>
            <h3>Siri Phrases</h3>
            <p className="small muted">After adding to Siri, try saying:</p>
          </div>
        </div>
        <div className="chips">
          {[
            "“Hey Siri, log expense 12 dollars coffee”",
            "“Hey Siri, quick spend 45 lunch”",
            "“Hey Siri, add 8.50 transport”",
            "“Hey Siri, what’s my spending today”",
          ].map((p) => (
            <span key={p} className="chip">
              {p}
            </span>
          ))}
        </div>
      </div>
      <div className="panel stack mt-3">
        <div className="row between">
          <div>
            <h3>Services Menu & Finder</h3>
            <p className="small muted">
              Right-click selected text in any app → Services → Quick Log
            </p>
          </div>
        </div>
        <div className="shade">
          <div className="context-menu-preview">
            <div className="context-section">
              <div className="context-item">
                <Icon name="copy" /> Copy
              </div>
              <div className="context-item">
                <Icon name="content_paste" /> Paste
              </div>
              <div className="context-divider" />
              <div className="context-item chosen">
                <Icon name="bolt" className="mint" />
                <span>Quick Log “$14.50 lunch”</span>
              </div>
              <div className="context-item">
                <Icon name="share" /> Share…
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
