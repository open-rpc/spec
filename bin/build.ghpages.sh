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

const build = async () => {
  const buildDir = "./build/ghpages";

  await fsx.ensureDir(buildDir);
  await fsx.emptyDir(buildDir);

  await downloadReleases("open-rpc", "spec", buildDir, filterRelease, filterAsset, leaveZipped, disableLogging);

  const previousVersions = await readdir(buildDir);

  await Promise.all(previousVersions.map(async (version) => {
    const dirName = `${buildDir}/${version}`;
    const [filename] = await readdir(dirName);
    await fsx.move(`${dirName}/${filename}`, `${dirName}/index.md`);
  }));



  await buildMarkdown();
  const markdownBuildFilename = "./build/markdown/spec.md";
  let latestVersionFolderName = `${buildDir}/${specVersion}`;

  await mkdir(`${buildDir}/latest`);
  try {
    await mkdir(latestVersionFolderName);
  } catch (e) {
    console.log(`latest version already exists as a release on github: ${latestVersionFolderName}`);
    latestVersionFolderName = `${buildDir}/development`;
    await mkdir(latestVersionFolderName);
  }
  await copyFile(markdownBuildFilename, `${buildDir}/index.md`);
  await copyFile(markdownBuildFilename, `${buildDir}/latest/index.md`);
  await copyFile("./build/markdown/spec.md", `${latestVersionFolderName}/spec.md`);

  await writeFile(`${buildDir}/CNAME`, "spec.open-rpc.org");

  console.log("building ghpages complete. gh-pages build ready to release!");
};

if (require.main === module) {
  build();
} else {
  module.exports = build;
}
