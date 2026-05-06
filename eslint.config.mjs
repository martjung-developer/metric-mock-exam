// eslint.config.mjs
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    rules: {
      // TypeScript rules
      "@typescript-eslint/no-unused-vars": ["warn"],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",

      // React & Next.js rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/set-state-in-render": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react/no-unescaped-entities": "warn",
      "next/no-img-element": "off",

      // General code quality
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "eqeqeq": ["warn", "always"],
      "curly": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
