// eslint.config.js
// ==========================================
// Minimal, non-type-checked ESLint for the server.
//
// `tsc` is the authority on types here — and on dead code, via `noUnusedLocals` —
// so this config targets the bugs types cannot see: unreachable code, stray
// `debugger`, promises nobody awaits, pointless `await`s, empty catch blocks.
//
// Type-aware rules are deliberately NOT enabled: this codebase leans on `any`
// around mongoose and express, and `no-unsafe-*` would bury real findings under
// hundreds of style errors. `no-explicit-any` stays a warning so the debt is
// visible without blocking a build.
//
//   npm run lint
// ==========================================
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "scripts/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // tsc owns unused code; `args: "none"` because Express handlers must keep
      // their (req, res, next) shape even when a parameter goes unused.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { args: "none", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  }
);
