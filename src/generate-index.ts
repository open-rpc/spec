import { readdirSync, mkdirSync, writeFileSync, statSync } from "fs";
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

console.log("Discovered spec versions:", versions.join(", "));

// Copy spec/{version}/ → generated/{x_y}/ (dots → underscores)
const toDirName = (v: string) => v.replace(/\./g, "_");
mkdirSync(GENERATED_DIR, { recursive: true });
for (const version of versions) {
  const src = join(SPEC_DIR, version);
  const dest = join(GENERATED_DIR, toDirName(version));
  copySync(src, dest);
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
console.log("Generated generated/index.ts");
