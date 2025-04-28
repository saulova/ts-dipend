import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import tsEslint from "typescript-eslint";
import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";

const ignore = ["./**/dist/**/*.js", "./**/coverage/**/*.js", "./**/node_modules/**/*.js"];

const tsRecommended = tsEslint
  .config(
    eslint.configs.recommended,
    ...tsEslint.configs.recommended,
    eslintConfigPrettier,
    eslintPluginPrettierRecommended,
  )
  .map((item) => {
    return {
      ...item,
      files: ["packages/**/src/**/*.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
      },
    };
  });

export default [...tsRecommended, ...defineConfig([globalIgnores(ignore)])];
