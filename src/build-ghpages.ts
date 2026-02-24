import { readdir, writeFile } from "fs/promises";
import fsx from "fs-extra";
import downloadReleases from "@etclabscore/dl-github-releases";
import { build as buildMarkdown } from "./build-markdown";
import { discoverLatestVersion, getAllRecentVersions } from "./version";

const leaveZipped = false;

const filterRelease = () => {
  return true;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const filterAsset = (...args: any[]) => {
  const asset = args[0];
  return asset.name.indexOf(".md") >= 0;
};

const compareSemver = (v1: string, v2: string): number => {
  // Split into [core, pre] -> ["1.2.0", "rc1"]
  const [core1, pre1] = v1.split("-");
  const [core2, pre2] = v2.split("-");

  const n1 = core1.split(".").map(Number);
  const n2 = core2.split(".").map(Number);

  // 1. Compare Core Version Numerically
  for (let i = 0; i < 3; i++) {
    if (n1[i] > n2[i]) return 1;
    if (n1[i] < n2[i]) return -1;
  }

  // 2. If core versions are identical, check pre-release tags
  // A version with NO tag is GREATER than a version with a tag (e.g., 1.0.0 > 1.0.0-rc1)
  if (pre1 && !pre2) return -1;
  if (!pre1 && pre2) return 1;
  if (!pre1 && !pre2) return 0;

  // 3. Compare "rc0" vs "rc1" (Lexicographical works here because lengths are same)
  if (pre1 > pre2) return 1;
  if (pre1 < pre2) return -1;

  return 0;
};

export const build = async () => {
  const buildDir = "./docs";
  const specDir = "./spec";

  await fsx.ensureDir(buildDir);
  await fsx.emptyDir(buildDir);

  await downloadReleases(
    "open-rpc",
    "spec",
    buildDir,
    filterRelease,
    filterAsset,
    leaveZipped,
  );

  const previousVersions = await readdir(buildDir);

  await Promise.all(
    previousVersions.map(async (version) => {
      if (compareSemver(version, "1.4.0") <= 0) {
        const dirName = `${buildDir}/${version}`;
        const [filename] = await readdir(dirName);
        await fsx.move(`${dirName}/${filename}`, `${dirName}/index.md`);
      }
    }),
  );

  const latestVersion = discoverLatestVersion();
  // eslint-disable-next-line no-console
  console.log(`latestVersion: ${latestVersion}`);
  const recentVersions = getAllRecentVersions();
  await Promise.all(
    recentVersions.map(async (version) => {
      // eslint-disable-next-line no-console
      console.log(`building version: ${version}`);
      const dirName = `${specDir}/${version}`;
      const buildDirName = `${buildDir}/${version}`;

      await fsx.ensureDir(buildDirName);

      const markdown = await buildMarkdown(`${dirName}/schema.json`);
      await writeFile(`${buildDirName}/index.md`, markdown);

      if (latestVersion === version) {
        await fsx.ensureDir(`${buildDir}/latest`);
        await writeFile(`${buildDir}/latest/index.md`, markdown);
        await writeFile(`${buildDir}/index.md`, markdown);
      }
    }),
  );
  // write CNAME file
  await writeFile(`${buildDir}/CNAME`, "spec.open-rpc.org");

  // eslint-disable-next-line no-console
  console.log("building docs complete. docs/ ready to deploy!");
};

if (import.meta.main) {
  await build();
}
