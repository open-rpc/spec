import { build } from "bun";
import { readdirSync, statSync, mkdirSync, copyFileSync } from "fs";
import { join } from "path";

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

// eslint-disable-next-line no-console
console.log("Bundle built successfully");

const SPEC_DIR = join(import.meta.dir, "..", "spec");
const DIST_DIR = join(import.meta.dir, "..", "dist");

const versions = readdirSync(SPEC_DIR).filter((entry) => {
  const full = join(SPEC_DIR, entry);
  return statSync(full).isDirectory() && /^\d+\.\d+$/.test(entry);
});

const toDirName = (v: string) => v.replace(/\./g, "_");

for (const version of versions) {
  const dirName = toDirName(version);
  const destDir = join(DIST_DIR, dirName);
  mkdirSync(destDir, { recursive: true });
  copyFileSync(
    join(SPEC_DIR, version, "schema.json"),
    join(destDir, "schema.json"),
  );
  // eslint-disable-next-line no-console
  console.log(
    `Copied spec/${version}/schema.json → dist/${dirName}/schema.json`,
  );
}
