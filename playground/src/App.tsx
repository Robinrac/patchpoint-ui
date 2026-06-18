import { useState, type CSSProperties } from "react";
import { AllPropsPage } from "./pages/AllPropsPage";
import { LanguageSwitcherPage } from "./pages/LanguageSwitcherPage";
import { PAGE_BG } from "./constants";

type Page = "particle-image" | "language-switcher";

const NAV: { id: Page; label: string }[] = [
  { id: "particle-image", label: "ParticleImage" },
  { id: "language-switcher", label: "LanguageSwitcher" },
];

export function App() {
  const [page, setPage] = useState<Page>("language-switcher");

  return (
    <div style={styles.app}>
      <nav style={styles.nav}>
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPage(item.id)}
            style={{
              ...styles.navBtn,
              ...(page === item.id ? styles.navBtnActive : {}),
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
      {page === "particle-image" && <AllPropsPage />}
      {page === "language-switcher" && <LanguageSwitcherPage />}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  app: {
    minHeight: "100vh",
    background: PAGE_BG,
  },
  nav: {
    display: "flex",
    gap: 8,
    padding: "1rem 2rem",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  navBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 6,
    color: "rgba(255,255,255,0.6)",
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
    fontSize: "0.8rem",
    fontWeight: 500,
    padding: "6px 14px",
  },
  navBtnActive: {
    background: "rgba(45,156,219,0.15)",
    borderColor: "rgba(45,156,219,0.5)",
    color: "#56ccf2",
  },
};
