import { defineConfig } from "vitest/config";
import tsPlugin from "@rollup/plugin-typescript";
const tspCompiler = require("ts-patch/compiler");

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      exclude: [
        "**/node_modules/**",
        "**/vitest.config.ts",
        "**/dist/**",
        "**/index.ts",
        "**/advanced.ts",
        "**/mapped-dependency.ts",
        "**/*.type.ts",
        "**/*.interface.ts",
        "**/*.test.ts",
        "**/tsc-plugin/ast-visit-handler.ts",
        "**/tsc-plugin/get-patched-host.ts",
        "**/tsc-plugin/transform-program.ts",
        "**/cli/**",
      ],
    },
  },
  server: {
    host: "127.0.0.1",
  },
  plugins: [tsPlugin({ typescript: tspCompiler })],
});
