// ==========================================
// Theme store (zero imports on purpose)
// ==========================================
// Kept in its own module so that both `constants/index.ts` (which builds the
// `COLORS` getters) and `context/SettingsContext.tsx` (which drives it) can
// import it without creating a circular dependency.

let isDarkTheme = false;

/** Called by <SettingsProvider> whenever the resolved theme changes. */
export function setThemeIsDark(value: boolean) {
  if (isDarkTheme === value) return;
  isDarkTheme = value;
  notify();
}

export function getThemeIsDark() {
  return isDarkTheme;
}

// ==========================================
// Subscription (for components that build their own StyleSheet)
// ==========================================
type Listener = () => void;

const listeners = new Set<Listener>();

/** Register a callback fired whenever the resolved theme flips. */
export function subscribeToTheme(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  listeners.forEach((listener) => listener());
}
