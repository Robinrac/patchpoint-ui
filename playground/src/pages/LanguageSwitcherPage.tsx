import { useState, type CSSProperties } from "react";
import { LanguageSwitcher } from "../../../src/LanguageSwitcher";
import type { LanguageSwitcherLocale } from "../../../src/LanguageSwitcher";
import { T } from "../theme";

export function LanguageSwitcherPage() {
  const [locale, setLocale] = useState<LanguageSwitcherLocale>("en");
  const [localeB, setLocaleB] = useState<LanguageSwitcherLocale>("sv");

  return (
    <div style={styles.page}>
      <p style={T.eyebrow}>@patchpoint/ui</p>
      <h1 style={T.heading}>LanguageSwitcher</h1>
      <p style={T.body}>
        Controlled EN / SV language switcher. The package owns the flag SVGs,
        short labels, and dropdown interaction. The consuming app owns locale
        state, persistence, and translation.
      </p>

      {/* ── Header context — matches SkillTap placement ── */}
      <section style={styles.card}>
        <p style={styles.label}>HEADER CONTEXT — transparent dropdown</p>
        <p style={T.body}>
          The dropdown has no background of its own — it floats over whatever is
          below it. Font inherits from the parent; load Space Grotesk on body to
          match SkillTap exactly.
        </p>
        <div style={styles.headerBar}>
          <span style={styles.headerTitle}>My App</span>
          <LanguageSwitcher
            value={locale}
            onChange={setLocale}
            ariaLabel="Select language"
          />
        </div>
        <p style={{ ...T.body, marginTop: 8 }}>
          Current locale: <strong style={{ color: "#fff" }}>{locale.toUpperCase()}</strong>
        </p>
      </section>

      {/* ── Side-by-side EN and SV ── */}
      <section style={styles.card}>
        <p style={styles.label}>BOTH LOCALES SIDE BY SIDE</p>
        <div style={styles.headerBarNarrow}>
          <LanguageSwitcher
            value="en"
            onChange={() => {}}
            ariaLabel="Select language (EN active)"
          />
          <LanguageSwitcher
            value="sv"
            onChange={() => {}}
            ariaLabel="Select language (SV active)"
          />
        </div>
      </section>

      {/* ── Two independent instances ── */}
      <section style={styles.card}>
        <p style={styles.label}>TWO INDEPENDENT CONTROLLED INSTANCES</p>
        <div style={styles.row}>
          <LanguageSwitcher value={locale} onChange={setLocale} ariaLabel="Instance A" />
          <LanguageSwitcher value={localeB} onChange={setLocaleB} ariaLabel="Instance B" />
        </div>
        <p style={{ ...T.body, marginTop: 8 }}>
          A: {locale.toUpperCase()} · B: {localeB.toUpperCase()} — each manages its own open state
          and SVG clip-path IDs independently
        </p>
      </section>

      {/* ── Disabled ── */}
      <section style={styles.card}>
        <p style={styles.label}>DISABLED</p>
        <div style={styles.row}>
          <LanguageSwitcher
            value="en"
            onChange={() => {}}
            ariaLabel="Select language"
            disabled
          />
        </div>
      </section>

      {/* ── Custom ariaLabel ── */}
      <section style={styles.card}>
        <p style={styles.label}>CUSTOM ariaLabel (Swedish)</p>
        <div style={styles.row}>
          <LanguageSwitcher
            value={locale}
            onChange={setLocale}
            ariaLabel="Välj språk"
          />
        </div>
      </section>

      {/* ── API reference ── */}
      <section style={{ ...styles.card, marginTop: 32 }}>
        <p style={styles.label}>API</p>
        <pre style={styles.code}>{`import { LanguageSwitcher } from "@patchpoint/ui";
import type { LanguageSwitcherLocale } from "@patchpoint/ui";

// Controlled — app owns locale state and persistence
const [locale, setLocale] = useState<LanguageSwitcherLocale>("en");

<LanguageSwitcher
  value={locale}
  onChange={setLocale}       // required — update your locale state here
  ariaLabel="Select language" // optional, translatable by consuming app
  className="..."             // optional — for placement / sizing
  disabled={false}            // optional
/>`}</pre>
        <p style={{ ...T.body, marginTop: 16 }}>
          The package owns English and Swedish as the only options, their flag
          SVGs, short labels (EN / SV), and full names (English / Svenska).
          Persistence (localStorage, cookies, API) is the app&rsquo;s responsibility.
          The dropdown is transparent — the consuming app&rsquo;s header background
          shows through.
        </p>
      </section>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "3rem 2rem",
  },
  card: {
    background: "rgba(10, 7, 34, 0.72)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "1.25rem",
    padding: "1.5rem",
    marginBottom: "1.5rem",
  },
  label: {
    fontFamily: "system-ui, sans-serif",
    fontSize: "0.7rem",
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "#56ccf2",
    margin: "0 0 0.75rem",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  // Simulates a real app header bar — dark gradient matching SkillTap's dashboard header
  headerBar: {
    background: "linear-gradient(135deg, #1e1050 0%, #0a0722 100%)",
    borderRadius: 12,
    height: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    marginTop: 12,
  },
  headerBarNarrow: {
    background: "linear-gradient(135deg, #1e1050 0%, #0a0722 100%)",
    borderRadius: 12,
    height: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    padding: "0 16px",
    marginTop: 12,
  },
  headerTitle: {
    fontFamily: "system-ui, sans-serif",
    color: "rgba(255,255,255,0.6)",
    fontSize: "0.875rem",
    fontWeight: 600,
  },
  code: {
    fontFamily: "monospace",
    fontSize: "0.8rem",
    lineHeight: 1.6,
    color: "#a0a0b8",
    background: "rgba(0,0,0,0.3)",
    borderRadius: 8,
    padding: "1rem",
    overflowX: "auto" as const,
    whiteSpace: "pre" as const,
    margin: 0,
  },
};
