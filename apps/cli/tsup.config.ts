import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  clean: true,
  target: "es2022",
  minify: false,
  sourcemap: false,
  dts: false,
  noExternal: [/@grandpa/],
  banner: {
    js: "#!/usr/bin/env bun",
  },
});