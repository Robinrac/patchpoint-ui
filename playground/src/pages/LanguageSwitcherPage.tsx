import { useState, type CSSProperties } from "react";
import { LanguageSwitcher } from "../../../src/LanguageSwitcher";
import type { LanguageSwitcherLocale } from "../../../src/LanguageSwitcher";
import { T } from "../theme";

export function LanguageSwitcherPage() {
  const [locale, setLocale] = useState<LanguageSwitcherLocale>("en");

  return (
    <div style={styles.page}>
      <p style={T.eyebrow}>@patchpoint/ui</p>
      <h1 style={T.heading}>LanguageSwitcher</h1>
      <p style={T.body}>
        Controlled EN / SV language switcher. The package owns the flag SVGs,
        short labels, and dropdown interaction. The consuming app owns locale
        state, persistence, and translation.
      </p>

      {/* ── Live demo ── */}
      <section style={styles.card}>
        <p style={styles.label}>CURRENT LOCALE: {locale.toUpperCase()}</p>
        <div style={styles.row}>
          <LanguageSwitcher
            value={locale}
            onChange={setLocale}
            ariaLabel="Select language"
          />
        </div>
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
    margin: "0 0 1rem",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 16,
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
