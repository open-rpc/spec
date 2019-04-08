#!/usr/bin/env node

const fsx = require("fs-extra");
const toc = require('markdown-toc');
const readFile = require("util").promisify(require("fs").readFile);
const writeFile = require("util").promisify(require("fs").writeFile);

const specVersion = require("./get-version.js");

const replaceVersionComments = s => s.replace("<!-- version -->", `Version ${specVersion}`);

const build = async () => {
  const buildDir = "./build/markdown/";
  await fsx.ensureDir(buildDir);
  await fsx.emptyDir(buildDir);
  const specContent = await readFile("./spec.md", "utf8");
  const withToc = toc(specContent).content;
  const withVersion = replaceVersionComments(withToc);
  await writeFile(`${buildDir}/spec.md`, withVersion);

  console.log("building markdown complete. Markdown is ready to be released!");

  return true;
};

if (require.main === module) {
  build();
} else {
  module.exports = build;
}
