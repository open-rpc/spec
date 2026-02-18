#!/usr/bin/env node

const {promisify} = require("util");
const downloadReleases = require('@etclabscore/dl-github-releases').default;
const fs = require("fs");
const mkdir = promisify(fs.mkdir);
const copyFile = promisify(fs.copyFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const fsx = require("fs-extra");
const buildMarkdown = require("./build.markdown.sh");
const specVersion = require("./get-version.js");

const leaveZipped = false;
const disableLogging = false;
const filterRelease = (release) => {
  return true;
}
const filterAsset = (asset) => {
  return asset.name.indexOf('.md') >= 0;
}

const compareSemver = (v1, v2) => {
  // Split into [core, pre] -> ["1.2.0", "rc1"]
  const [core1, pre1] = v1.split('-');
  const [core2, pre2] = v2.split('-');

  const n1 = core1.split('.').map(Number);
  const n2 = core2.split('.').map(Number);

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
}


const build = async () => {
  const buildDir = "./docs";

  await fsx.ensureDir(buildDir);
  await fsx.emptyDir(buildDir);

  await downloadReleases("open-rpc", "spec", buildDir, filterRelease, filterAsset, leaveZipped, disableLogging);

  const previousVersions = await readdir(buildDir);

  await Promise.all(previousVersions.map(async (version) => {
  if (compareSemver(version,"1.4.0") <= 0){
    const dirName = `${buildDir}/${version}`;
    const [filename] = await readdir(dirName);
    await fsx.move(`${dirName}/${filename}`, `${dirName}/index.md`);
    }
  }));



  await buildMarkdown();
  const markdownBuildFilename = "./build/markdown/spec.md";
  // let latestVersionFolderName = `${buildDir}/${specVersion}`;

  // NOTE: No longer building latest version folder
  // await mkdir(`${buildDir}/latest`);
  try {
    await mkdir(latestVersionFolderName);
  } catch (e) {
    console.log(`latest version already exists as a release on github: ${latestVersionFolderName}`);
    latestVersionFolderName = `${buildDir}/development`;
    await mkdir(latestVersionFolderName);
  }
  // await copyFile(markdownBuildFilename, `${buildDir}/index.md`);
  // await copyFile(markdownBuildFilename, `${buildDir}/latest/index.md`);
  // await copyFile("./build/markdown/spec.md", `${latestVersionFolderName}/spec.md`);

  await writeFile(`${buildDir}/CNAME`, "spec.open-rpc.org");

  console.log("building docs complete. docs/ ready to deploy!");
};

if (require.main === module) {
  build();
} else {
  module.exports = build;
}
