// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/**'],
  },
  {
    // Node scripts, not app code. `eslint-config-expo` assumes a browser/React
    // Native environment, so `__dirname` and `require` read as undefined globals
    // there and fail. They are correct in a plain Node file, so the environment
    // is stated instead of worked around.
    files: ['scripts/**/*.{js,cjs,mjs}'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'writable',
        require: 'readonly',
        process: 'readonly',
      },
    },
  },
]);
