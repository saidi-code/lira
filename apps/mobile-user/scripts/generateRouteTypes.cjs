const fs = require("node:fs");
const path = require("node:path");
const requireContext = require("expo-router/build/testing-library/require-context-ponyfill").default;
const { getTypedRoutesDeclarationFile } = require("expo-router/build/typed-routes/generate");
const { EXPO_ROUTER_CTX_IGNORE } = require("expo-router/_ctx-shared");

const projectRoot = process.cwd();
const appRoot = path.join(projectRoot, "app");
const outputDirectory = path.join(projectRoot, ".expo", "types");

if (!fs.existsSync(appRoot)) {
  throw new Error(`Expo Router app directory not found: ${appRoot}`);
}

const context = requireContext(appRoot, true, EXPO_ROUTER_CTX_IGNORE);
const declarations = getTypedRoutesDeclarationFile(context);
fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(path.join(outputDirectory, "router.d.ts"), declarations);
console.log(`Generated Expo Router types from ${context.keys().length} app files.`);
