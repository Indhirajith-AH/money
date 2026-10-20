import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Icon, Toggle, Modal, useSpend } from "@/components/spend-shell";
import { ReceivePay } from "@/components/spend/receive-pay";
import { IphoneShortcut } from "@/components/spend/ios/iphone-shortcut";
import { MacOSShortcut } from "@/components/spend/macos/macos-shortcut";
import {
  DEFAULT_MAIN_CATEGORIES,
  FOOTER_QUICK_CATEGORY,
  getCustomCategories,
  saveCustomCategories,
  type CategoryItem,
} from "@/lib/categories";
function Heading({ icon, title, status }: { icon: string; title: string; status: string }) {
  return (
    <div className="section-head">
      <div className="row">
        <Icon name={icon} className="mint" />
        <h2>{title}</h2>
      </div>
      <span className="label mint">{status}</span>
    </div>
  );
}
function SwitchRow({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: string;
}) {
  const [on, setOn] = useState(true);
  return (
    <div className="setting-row">
      <div className="row">
        {icon && (
          <div className="icon-disc">
            <Icon name={icon} />
          </div>
        )}
        <div>
          <div className="strong">{title}</div>
          <div className="small muted">{description}</div>
        </div>
      </div>
      <Toggle label={title} checked={on} onChange={() => setOn(!on)} />
    </div>
  );
}
export function Settings() {
  const { expenses, notify, profile, updateProfile, session, signOut, currencySymbol } = useSpend();
  const [budget, setBudget] = useState("0.00");
  const [mode, setMode] = useState("Dynamic Engine");
  const [currency, setCurrency] = useState("INR");
  const [guide, setGuide] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<{ prompt: () => Promise<void> } | null>(null);
  useEffect(() => {
    const h = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as unknown as { prompt: () => Promise<void> });
    };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);
  const [sync, setSync] = useState(false);
  useEffect(() => {
    if (!profile) return;
    setBudget(
      (profile.monthly_budget || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    );
    setCurrency(profile.currency || "INR");
  }, [profile?.monthly_budget, profile?.currency]);
  const symbols: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ" };

  const [customCats, setCustomCats] = useState<CategoryItem[]>([]);
  const [newCatName, setNewCatName] = useState("");

  useEffect(() => {
    setCustomCats(getCustomCategories());
  }, []);

  const handleAddCustomCat = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (
      DEFAULT_MAIN_CATEGORIES.some((c) => c.name.toLowerCase() === trimmed.toLowerCase()) ||
      customCats.some((c) => c.name.toLowerCase() === trimmed.toLowerCase()) ||
      trimmed.toLowerCase() === FOOTER_QUICK_CATEGORY.name.toLowerCase()
    ) {
      notify("Category already exists");
      return;
    }
    const updated = [...customCats, { name: trimmed, icon: "label", isCustom: true }];
    setCustomCats(updated);
    saveCustomCategories(updated);
    setNewCatName("");
    notify(`Added category "${trimmed}" to Quick Log!`);
  };

  const handleRemoveCustomCat = (name: string) => {
    const updated = customCats.filter((c) => c.name !== name);
    setCustomCats(updated);
    saveCustomCategories(updated);
    notify(`Removed category "${name}"`);
  };

  const download = (content: string, name: string, type: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main className="page settings-page stack">
      <section className="panel row between">
        <div className="row">
          <div className="icon-disc">
            <Icon name={session ? "cloud_done" : "cloud_off"} />
          </div>
          <div>
            <div className="strong">
              {session ? profile?.display_name || session.user.email : "Not signed in"}
            </div>
            <div className="small muted">
              {session
                ? "Expenses & settings sync across devices"
                : "Sign in to save expenses to the cloud"}
            </div>
          </div>
        </div>
        {session ? (
          <Button variant="action" onClick={() => void signOut()}>
            Sign out
          </Button>
        ) : (
          <Link to="/auth" className="badge success">
            Sign in
          </Link>
        )}
      </section>
      <ReceivePay />
      <IphoneShortcut />
      <MacOSShortcut />
      <div className="panel high row between">
        <div className="row">
          <div className="icon-disc">
            <Icon name="tune" />
          </div>
          <div>
            <h2>Engine &amp; Triggers</h2>
            <div className="small muted">Calibrate calculation rules and quick-launch nodes</div>
          </div>
        </div>
        <span className="badge success">
          <i className="dot" />
          Active
        </span>
      </div>
      <section>
        <Heading
          icon="account_balance_wallet"
          title="Daily Allowance Engine"
          status="v2.4 Auto-Balancing"
        />
        <div className="panel stack">
          <div className="setting-row">
            <div>
              <label htmlFor="currency-select" className="small muted">
                Preferred Currency
              </label>
              <div className="label">Used across all calculations &amp; splits</div>
            </div>
            <select
              id="currency-select"
              className="field small"
              value={currency}
              onChange={(e) => {
                const newCur = e.target.value;
                setCurrency(newCur);
                void updateProfile({ currency: newCur });
              }}
            >
              {Object.entries(symbols).map(([c, s]) => (
                <option value={c} key={c}>
                  {c} ({s})
                </option>
              ))}
            </select>
          </div>
          <div className="setting-row">
            <div>
              <label htmlFor="monthly-budget" className="small muted">
                Total Monthly Allocation
              </label>
              <div className="label">Calculated across 30 active days</div>
            </div>
            <div className="row field">
              <span className="mint">{symbols[currency] || currencySymbol}</span>
              <input
                id="monthly-budget"
                className="budget-input bg-transparent border-0 outline-none mono"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                onBlur={() => {
                  const n = Number(budget.replaceAll(",", ""));
                  void updateProfile({ monthly_budget: n >= 0 ? n : 0 });
                  setBudget(
                    (n >= 0 ? n : 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }),
                  );
                }}
              />
            </div>
          </div>
          <div>
            <div className="small muted mb-2">Allowance Logic</div>
            <div className="segments setting-mode">
              {["Dynamic Engine", "Fixed Daily Limit"].map((m) => (
                <Button
                  variant="segment"
                  key={m}
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                >
                  <strong>{m}</strong>
                  <small>
                    {m === "Dynamic Engine"
                      ? "Remaining ÷ Days"
                      : `${symbols[currency] || currencySymbol}${((Number(budget.replaceAll(",", "")) || 0) / 30).toFixed(2)} flat / day`}
                  </small>
                </Button>
              ))}
            </div>
          </div>
          <div className="inset-row row between">
            <div className="row">
              <div className="icon-disc mono small">100%</div>
              <div>
                <div className="mono small">
                  {symbols[currency] || currencySymbol}
                  {((Number(budget.replaceAll(",", "")) || 0) / 30).toFixed(2)}{" "}
                  available today
                </div>
                <div className="small muted">
                  {Math.max(0, 30 - new Date().getDate())} days remaining in cycle
                </div>
              </div>
            </div>
            <Icon name="auto_graph" className="mint" />
          </div>
          <SwitchRow
            title="Surplus Rollover"
            description="Carry unspent funds forward to raise tomorrow's allowance"
          />
        </div>
      </section>

      {/* Custom Categories Configuration */}
      <section>
        <Heading icon="category" title="Quick Log Categories" status="Customizable" />
        <div className="panel stack">
          <div className="small muted">
            Categories available in your standalone Quick Log pop-up screen.
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {DEFAULT_MAIN_CATEGORIES.map((c) => (
              <div
                key={c.name}
                className="badge row px-3 py-1.5 text-xs bg-secondary/60 border border-border/60"
              >
                <Icon name={c.icon} className="mint mr-1 text-sm" />
                <span>{c.name}</span>
                <span className="text-[10px] text-muted-foreground ml-1">(default)</span>
              </div>
            ))}
            <div className="badge row px-3 py-1.5 text-xs bg-secondary/60 border border-border/60">
              <Icon name={FOOTER_QUICK_CATEGORY.icon} className="mint mr-1 text-sm" />
              <span>{FOOTER_QUICK_CATEGORY.name}</span>
              <span className="text-[10px] text-muted-foreground ml-1">(footer)</span>
            </div>
            {customCats.map((c) => (
              <div
                key={c.name}
                className="badge row px-3 py-1.5 text-xs bg-primary/10 border border-primary/40 text-primary"
              >
                <Icon name={c.icon} className="mr-1 text-sm" />
                <span className="font-semibold">{c.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCustomCat(c.name)}
                  className="ml-2 text-muted-foreground hover:text-destructive cursor-pointer font-bold"
                  title="Remove category"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="row gap-2 mt-2 pt-2 border-t border-border/40">
            <input
              type="text"
              placeholder="Add extra category (e.g. Gym, Books, Travel)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="field flex-1 text-sm py-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomCat();
                }
              }}
            />
            <Button
              variant="action"
              onClick={handleAddCustomCat}
              disabled={!newCatName.trim()}
              className="cursor-pointer"
            >
              <Icon name="add" />
              Add Extra
            </Button>
          </div>
        </div>
      </section>
      <section>
        <Heading icon="touch_app" title="Android Quick Triggers" status="Zero-Friction" />
        <div className="panel stack">
          <div className="row between">
            <div>
              <span className="badge success mb-2">
                <Icon name="sensors" />
                Connected &amp; Active
              </span>
              <h2>Quick Settings Tile</h2>
              <p className="small muted">
                Log an expense straight from your swipe-down notification panel
              </p>
            </div>
            <div className="icon-disc">
              <Icon name="bolt" />
            </div>
          </div>
          <div className="shade">
            <div className="row between label">
              <span>System Shade Preview</span>
              <span>Android 14+</span>
            </div>
            <div className="shade-grid">
              {(
                [
                  ["wifi", "Internet"],
                  ["bluetooth", "Bluetooth"],
                  ["bolt", "QuickSpend"],
                  ["do_not_disturb_on", "DND"],
                ] as const
              ).map(([i, t]) => (
                <div className={`shade-item ${t === "QuickSpend" ? "chosen" : ""}`} key={t}>
                  <div className="icon-disc">
                    <Icon name={i} />
                  </div>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
          <Button
            variant="tool"
            className="w-full justify-between h-auto py-3 whitespace-normal text-left"
            onClick={() => setGuide(true)}
          >
            <span className="row">
              <Icon name="install_mobile" className="mint" />
              Install &amp; add Quick Log shortcut
            </span>
            <Icon name="arrow_forward" />
          </Button>
        </div>
        <div className="panel stack mt-3">
          <div className="row between">
            <div>
              <h2>Lockscreen &amp; Assistant</h2>
              <p className="small muted">
                Launch via long-press Power button or Lockscreen shortcut slot
              </p>
            </div>
            <Icon name="phonelink_setup" className="muted" />
          </div>
          <div className="inset-row row between">
            <div className="row">
              <Icon name="radio_button_checked" className="mint" />
              <div>
                <div>Double-tap Power Button</div>
                <div className="small muted">Launches ultra-minimal instant keypad modal</div>
              </div>
            </div>
            <span className="label mint">Configured</span>
          </div>
          <div className="inset-row row between">
            <div className="row">
              <Icon name="mic" className="mint" />
              <div>
                <div>Gemini / Assistant Phrase</div>
                <div className="small muted">“Hey Google, QuickSpend 14 dollars lunch”</div>
              </div>
            </div>
            <span className="label">Ready</span>
          </div>
          <SwitchRow
            title="Haptic Feedback on Save"
            description="Crisp mechanical tick feedback confirming logged amounts"
          />
        </div>
      </section>
      <section>
        <Heading icon="notifications_active" title="Alerts & Guardrails" status="Proactive" />
        <div className="panel">
          <SwitchRow
            icon="nightlight"
            title="Evening Review Alert"
            description="8:00 PM summary of day's tally and tomorrow's target"
          />
          <SwitchRow
            icon="speed"
            title="Allowance Velocity Warning"
            description="Vibrate when spending reaches 85% of today's pool"
          />
        </div>
      </section>
      <section>
        <Heading icon="database" title="Data Vault & Regional" status="Encrypted" />
        <div className="panel stack">
          <div className="setting-row">
            <div className="row">
              <div className="icon-disc">
                <Icon name="currency_exchange" />
              </div>
              <div>
                <div className="strong">Display Currency</div>
                <div className="small muted">Primary valuation formatting</div>
              </div>
            </div>
            <select
              className="field small mint"
              aria-label="Display Currency"
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                if (session) void updateProfile({ currency: e.target.value });
              }}
            >
              {Object.entries(symbols).map(([c, s]) => (
                <option key={c} value={c}>
                  {c} ({s})
                </option>
              ))}
            </select>
          </div>
          <div className="inset-row row between">
            <div className="row">
              <Icon name="cloud_sync" className="mint" />
              <div>
                <div>Google Drive Auto-Sync</div>
                <div className="small muted">Synced 14m ago to personal vault</div>
              </div>
            </div>
            <Button variant="action" onClick={() => setSync(true)}>
              Sync Now
            </Button>
          </div>
          <div className="action-grid">
            <Button
              variant="tool"
              onClick={() =>
                download(
                  "Name,Category,Amount,Time\n" +
                    expenses
                      .map(
                        (e) =>
                          `"${e.name.replaceAll('"', '""')}","${e.category}",${e.amount},${e.time}`,
                      )
                      .join("\n"),
                  "quickspend-expenses.csv",
                  "text/csv",
                )
              }
            >
              <Icon name="file_download" className="mint" />
              <span className="label">Export CSV</span>
            </Button>
            <Button
              variant="tool"
              onClick={() =>
                download(
                  JSON.stringify({ expenses }, null, 2),
                  "quickspend-backup.json",
                  "application/json",
                )
              }
            >
              <Icon name="security" className="mint" />
              <span className="label">Backup Keys</span>
            </Button>
          </div>
        </div>
      </section>
      <div className="footer-note">⌘ QuickSpend Core 3.12.0 · Android Native Integration</div>
      {guide && (
        <Modal title="Phone shortcut to Quick Log" onClose={() => setGuide(false)}>
          <ol className="small stack guide-steps">
            <li>Open QuickSpend in Chrome on your phone (the published link, not this editor).</li>
            <li>
              Tap <strong>Install app</strong> below, or Chrome menu →{" "}
              <strong>Add to Home screen</strong>.
            </li>
            <li>
              Long-press the QuickSpend icon → <strong>Quick Log</strong>. Drag it out to pin a
              one-tap Quick Log icon.
            </li>
            <li>
              For the lock screen, add that Quick Log icon to your lock-screen shortcut slot
              (Settings → Lock screen → Shortcuts) where your phone supports it.
            </li>
          </ol>
          <p className="small muted mt-3">
            A true notification-shade tile needs a separate Android app; installing gives you the
            closest one-tap shortcut from a web app.
          </p>
          <div className="modal-actions">
            {installPrompt ? (
              <Button
                onClick={async () => {
                  await installPrompt.prompt();
                  setInstallPrompt(null);
                  setGuide(false);
                }}
              >
                <Icon name="install_mobile" />
                Install app
              </Button>
            ) : (
              <Button onClick={() => setGuide(false)}>Got it</Button>
            )}
          </div>
        </Modal>
      )}
      {sync && (
        <Modal title="Google Drive Auto-Sync" onClose={() => setSync(false)}>
          <p className="small muted">
            Google Drive isn’t connected in this preview. You can export your current expenses or
            download a backup from Data Vault.
          </p>
          <div className="modal-actions">
            <Button
              onClick={() => {
                setSync(false);
                notify("Your data is available to export");
              }}
            >
              Got it
            </Button>
          </div>
        </Modal>
      )}
    </main>
  );
}
