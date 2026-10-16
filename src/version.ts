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

const releaseParts = (version: string): number[] => {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
    throw new Error(`Expected a stable release version, received ${version}`);
  }
  const parts = version.split(".").map(Number);
  if (!parts.every(Number.isSafeInteger))
    throw new Error(`Invalid version ${version}`);
  return parts;
};

export const compareReleaseVersions = (left: string, right: string): number => {
  const a = releaseParts(left);
  const b = releaseParts(right);
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
};

/** Select only compatibility lines released by this package version. */
export const selectReleaseSchemas = (
  releaseVersion = getPackageVersion(),
  specDir = "./spec",
) => {
  const [major, minor] = releaseParts(releaseVersion);
  const latestVersion = `${major}.${minor}`;
  const versions = fs
    .readdirSync(specDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d+\.\d+$/.test(entry.name))
    .map((entry) => entry.name)
    .filter(
      (version) =>
        compareReleaseVersions(`${version}.0`, `${latestVersion}.0`) <= 0,
    )
    .sort((a, b) => compareReleaseVersions(`${a}.0`, `${b}.0`));
  if (
    !versions.includes(latestVersion) ||
    !fs.existsSync(path.join(specDir, latestVersion, "schema.json"))
  ) {
    throw new Error(
      `Release ${releaseVersion} requires spec/${latestVersion}/schema.json`,
    );
  }
  return { releaseVersion, latestVersion, versions };
};
