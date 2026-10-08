const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
  { ignores: ["dist/**", "src/generated/**"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
