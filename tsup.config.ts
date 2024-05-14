import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/main.ts"],
  target: "es2022",
  tsconfig: "tsconfig.json",
  outDir: "dist",
  format: "esm",
  splitting: false,
  sourcemap: true,
  clean: true,
});
