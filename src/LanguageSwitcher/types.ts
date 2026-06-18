export type LanguageSwitcherLocale = "en" | "sv";

export interface LanguageSwitcherProps {
  /** Currently selected locale. */
  value: LanguageSwitcherLocale;
  /** Called when the user picks a different locale. The app is responsible for persisting the change. */
  onChange: (locale: LanguageSwitcherLocale) => void;
  /** External className for placement / sizing constraints. */
  className?: string;
  /** Accessible label for the trigger button and menu (defaults to "Select language"). */
  ariaLabel?: string;
  /** Disables interaction. */
  disabled?: boolean;
}
