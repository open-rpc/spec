#!/usr/bin/env node

const {promisify} = require("util");
const downloadReleases = require('@etclabscore/dl-github-releases');
const fs = require("fs");
const mkdir = promisify(fs.mkdir);
const copyFile = promisify(fs.copyFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);
const fsx = require("fs-extra");
const buildMarkdown = require("./build.markdown.sh");

const leaveZipped = false;
const disableLogging = false;
const filterRelease = (release) => {
  return true;
}
const filterAsset = (asset) => {
  return asset.name.indexOf('.md') >= 0;
}

const build = async () => {
  const buildDir = "./build/ghpages/";

  await fsx.ensureDir(buildDir);
  await fsx.emptyDir(buildDir);

  await downloadReleases("open-rpc", "spec", buildDir, filterRelease, filterAsset, leaveZipped, disableLogging);

  const previousVersions = await readdir(buildDir);

  await Promise.all(previousVersions.map(async (previousVersion) => {
    const version = previousVersion.replace(".md", "");
    const newDirName = `${buildDir}${version}`;
    await mkdir(newDirName);
    await copyFile(`${buildDir}${previousVersion}`, `${newDirName}/index.md`);
    await unlink(`${buildDir}${previousVersion}`);
  }));

  await buildMarkdown();
  await copyFile("./build/markdown/spec.md", `${buildDir}/index.md`);
  await mkdir(`${buildDir}/latest`);
  await copyFile("./build/markdown/spec.md", `${buildDir}/latest/index.md`);
  await writeFile(`${buildDir}/CNAME`, "spec.open-rpc.org");

  console.log("building ghpages complete. gh-pages build ready to release!");
};

if (require.main === module) {
  build();
} else {
  module.exports = build;
}
