import {
  readdirSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
  statSync,
} from "fs";
import { copySync } from "fs-extra";
import { join } from "path";

const SPEC_DIR = join(import.meta.dir, "..", "spec");
const GENERATED_DIR = join(import.meta.dir, "..", "generated");

// Discover version directories under spec/ (e.g. "1.3", "1.4")
const versions = readdirSync(SPEC_DIR)
  .filter((entry) => {
    const full = join(SPEC_DIR, entry);
    return statSync(full).isDirectory() && /^\d+\.\d+$/.test(entry);
  })
  .sort((a, b) => {
    const [aMaj, aMin] = a.split(".").map(Number);
    const [bMaj, bMin] = b.split(".").map(Number);
    return bMaj - aMaj || bMin - aMin; // descending so latest first
  });

if (versions.length === 0) {
  console.error("No spec versions found in", SPEC_DIR);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log("Discovered spec versions:", versions.join(", "));

// Copy spec/{version}/ → generated/{x_y}/ (dots → underscores)
const toDirName = (v: string) => v.replace(/\./g, "_");
mkdirSync(GENERATED_DIR, { recursive: true });
for (const version of versions) {
  const src = join(SPEC_DIR, version);
  const dest = join(GENERATED_DIR, toDirName(version));
  copySync(src, dest);
  // eslint-disable-next-line no-console
  console.log(`Copied spec/${version} → generated/${toDirName(version)}`);
}

// Build generated/index.ts
const toIdentifier = (v: string) => `OpenRPCSpecificationSchema${toDirName(v)}`;

const imports = versions
  .map((v) => `import ${toIdentifier(v)} from "./${toDirName(v)}/schema.json";`)
  .join("\n");

const exportNames = versions.map(toIdentifier).join(", ");

const schemaEntries = versions
  .map((v) => `  "${toDirName(v)}": ${toIdentifier(v)},`)
  .join("\n");

const indexContent = `${imports}
export { ${exportNames} };
export const getAllSchemas = () => {
  return {
${schemaEntries}
  }
};
`;

writeFileSync(join(GENERATED_DIR, "index.ts"), indexContent);
// eslint-disable-next-line no-console
console.log("Generated generated/index.ts");

// Patch package.json exports to expose individual schema JSONs from dist/
const pkgPath = join(import.meta.dir, "..", "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

const schemaExports: Record<string, string> = {};
for (const version of versions) {
  const dirName = toDirName(version);
  schemaExports[`./${dirName}/schema.json`] = `./dist/${dirName}/schema.json`;
}

pkg.exports = {
  ".": pkg.exports["."],
  ...schemaExports,
};

pkg.files = ["dist"];

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
// eslint-disable-next-line no-console
console.log("Updated package.json exports with schema paths");
