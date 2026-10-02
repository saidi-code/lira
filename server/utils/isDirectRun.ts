// utils/isDirectRun.ts
// ==========================================
// Whether this module is the process entry point.
//
// Every maintenance script ends with a guard so that importing it — from a test,
// or from another script — does not run `main()`. The pattern used was
// `process.argv[1]?.includes("<scriptName>")`, which is too loose: it also matches
// a *test file named after the script*. `tests/productIndexes.integration.test.ts`
// contains "productIndexes", so loading that test ran the script's `main()`, which
// then tried to connect to whatever `DB_URI` pointed at. A maintenance script must
// never start running because a test was imported.
//
// Comparing the basename without its extension makes the match exact:
// "productIndexes" matches the script and not "productIndexes.test".
// ==========================================
import path from "node:path";

export const isDirectRun = (
  moduleName: string,
  argv: readonly string[] = process.argv
): boolean => {
  const entry = argv[1];
  if (!entry) return false;

  return path.basename(entry, path.extname(entry)) === moduleName;
};