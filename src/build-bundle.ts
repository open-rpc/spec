import { build } from "bun";

const result = await build({
  entrypoints: ["./generated/index.ts"],
  outdir: "./dist",
  target: "browser",
  format: "esm",
  minify: true,
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

console.log("Bundle built successfully");
