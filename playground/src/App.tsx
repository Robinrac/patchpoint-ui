import type { CSSProperties } from "react";
import { AllPropsPage } from "./pages/AllPropsPage";
import { PAGE_BG } from "./constants";

export function App() {
  return (
    <div style={styles.app}>
      <AllPropsPage />
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  app: {
    minHeight: "100vh",
    background: PAGE_BG,
  },
};
