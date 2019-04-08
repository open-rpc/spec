#!/usr/bin/env node

const {promisify} = require("util");
const downloadReleases = require('@etclabscore/dl-github-releases');
const fs = require("fs");
const fsx = require("fs-extra");
var toc = require('markdown-toc');
const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const execFile = promisify(require('child_process').execFile);
const copyFile = promisify(fs.copyFile);


const specVersion = require("./get-version.js")

const replaceVersionComments = s => s.replace("<!-- version -->", `Version ${specVersion}`);

const build = async () => {
  const buildDir = "./build/markdown/";
  await fsx.ensureDir(buildDir);
  await fsx.emptyDir(buildDir);
  const specContent = await readFile("./spec.md", "utf8");
  const withToc = toc(specContent).content;
  const withVersion = replaceVersionComments(withToc);
  await writeFile(`${buildDir}/spec.md`, withVersion)

  console.log("building markdown complete. Markdown is ready to be released!");

  return true;
};

if (require.main === module) {
  build();
} else {
  module.exports = build;
}
