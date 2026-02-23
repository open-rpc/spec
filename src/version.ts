import * as fs from "fs";
import * as path from "path";

/** Read spec/ dir, find largest numeric (semver-ish) folder name */
export const discoverLatestVersion = (specDir = "./spec"): string => {
  const entries = fs.readdirSync(specDir, { withFileTypes: true });
  const numeric = entries
    .filter((e) => e.isDirectory() && /^\d+(\.\d+)*$/.test(e.name))
    .map((e) => e.name);

  if (numeric.length === 0)
    throw new Error(`No numeric version dirs found in ${specDir}`);

  numeric.sort((a, b) => {
    const pa = a.split(".").map(Number);
    const pb = b.split(".").map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
      if (diff !== 0) return diff;
    }
    return 0;
  });

  return numeric[numeric.length - 1];
};

export const getAllRecentVersions = (specDir = "./spec"): string[] => {
  const entries = fs.readdirSync(specDir, { withFileTypes: true });
  const numeric = entries
    .filter((e) => e.isDirectory() && /^\d+(\.\d+)*$/.test(e.name))
    .map((e) => e.name);
  return numeric;
};

/** Path to schema.json for the latest version */
export const latestSchemaPath = (specDir = "./spec"): string => {
  const version = discoverLatestVersion(specDir);
  return path.join(specDir, version, "schema.json");
};

/** Get package.json version */
export const getPackageVersion = (): string => {
  const pkg = JSON.parse(fs.readFileSync("./package.json", "utf8"));
  return pkg.version;
};
