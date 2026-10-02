// scripts/generateRouteTypes.cjs
// ==========================================
//   Writes .expo/types/router.d.ts without starting the dev server.
//
// Why this exists: expo-router only writes that file from the dev server, and
// `.expo/` is gitignored. So CI typechecked the client with no route types at
// all, which makes `router.push("/admin/typo")` compile clean in CI and fail on
// any machine that has run `expo start` once. It did exactly that twice while
// the backoffice was being built.
//
// `npx expo export --platform web` was tried as the fix: it bundles in ~113s and
// does NOT write the types either. So the types come from
// `getTypedRoutesDeclarationFile`, the real generator, fed a context we build
// ourselves.
//
// The context is a Metro `require.context`. expo-router's own ponyfill already
// produces the right key format (`./relative/path.tsx`) by walking the app
// directory, so we borrow its `keys()` — but its module function `require`s the
// real `.tsx` file, which Node cannot load. We replace that with a stub: the
// generator only reads `unstable_settings` and `ErrorBoundary` off a route, and
// `undefined` is exactly what a plain route exports.
//
// What is deliberately NOT done: reimplementing the generator, or committing the
// output. A committed copy would go stale silently and then look authoritative —
// worse than no types at all, because it would be wrong rather than absent.
// ==========================================
const fs = require("node:fs");
const path = require("node:path");

const APP_DIR = path.join(__dirname, "..", "app");
const OUT_DIR = path.join(__dirname, "..", ".expo", "types");
const OUT_FILE = path.join(OUT_DIR, "router.d.ts");

// expo-router 6 exposes these from its build output; they are CJS, which is why
// this script is .cjs and not .ts.
const { getTypedRoutesDeclarationFile } = require("expo-router/build/typed-routes/generate");
const requireContext =
  require("expo-router/build/testing-library/require-context-ponyfill").default;

if (!fs.existsSync(APP_DIR)) {
  console.error(`No app directory at ${APP_DIR}`);
  process.exit(1);
}

// Note: there is deliberately no version check against
// `expo-router/build/typed-routes`. Its `version` export is the *declaration
// format* number (52), not the package version, so comparing it to package.json
// compares two unrelated values and only ever produces a false alarm.

const ponyfill = requireContext(APP_DIR, true, /\.[tj]sx?$/, {});
// The generator reads `unstable_settings` and `ErrorBoundary` from a route
// module. A plain route exports neither, so an empty object is the faithful
// answer — not a guess that happens to satisfy the generator.
const stub = () => ({});

const context = Object.assign(stub, {
  keys: () => ponyfill.keys(),
  resolve: (key) => key,
  id: "0",
});

const keys = context.keys();
if (keys.length === 0) {
  console.error(`No route files found under ${APP_DIR}`);
  process.exit(1);
}

let declaration;
try {
  declaration = getTypedRoutesDeclarationFile(context, {});
} catch (error) {
  console.error("Route type generation failed:", error);
  process.exit(1);
}

// A sanity gate on the output. Checked for `hrefInputParams` rather than `Href`:
// the generated file does not spell `Href` anywhere, and an earlier check for it
// rejected a perfectly good file. (PowerShell's Select-String is case
// -insensitive by default, which is how that wrong check got written.)
const MIN_BYTES = 2000;

if (!declaration || declaration.length < MIN_BYTES || !declaration.includes("hrefInputParams")) {
  console.error("Generator output looks truncated — refusing to write it");
  console.error("A partial router.d.ts would silently make every router.push() unchecked.");
  console.error(`  got ${declaration ? declaration.length : 0} bytes, expected at least ${MIN_BYTES}`);
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, declaration, "utf8");

const routes = [...declaration.matchAll(/`\/([^`$]*)`/g)].length;
console.log(`Wrote ${path.relative(process.cwd(), OUT_FILE)}`);
console.log(`  from ${keys.length} file(s) in app/`);
console.log(`  ${routes} route(s) in the generated union`);
