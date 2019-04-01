#!/usr/bin/env node

const {promisify} = require("util");
const downloadReleases = require('@etclabscore/dl-github-releases');
const fs = require("fs");
const fsx = require("fs-extra");
const mkdir = promisify(fs.mkdir);
const execFile = promisify(require('child_process').execFile);
const copyFile = promisify(fs.copyFile);

const build = async () => {
  const buildDir = "./build/markdown/";
  await fsx.ensureDir(buildDir);
  await fsx.emptyDir(buildDir);
  await copyFile(`./spec.md`, `${buildDir}/index.md`);
  await execFile("./node_modules/.bin/markdown-toc", ["-i",`./${buildDir}/index.md`]);

  console.log("building markdown complete. Markdown is ready to be released!");

  return true;
};

if (require.main === module) {
  build();
} else {
  module.exports = build;
}
