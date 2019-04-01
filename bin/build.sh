#!/usr/bin/env node

const {promisify} = require("util");

const readdir = promisify(require("fs").readdir);
const execFile = promisify(require('child_process').execFile);
const fsx = require("fs-extra");

const build = async () => {
  const buildScriptFilenames = await readdir(__dirname);

  const buildTargets = buildScriptFilenames
        .filter((filename) => filename !== "build.sh")
        .map((filename) => filename.split(".")[1]);

  // run each build script
  const output = await Promise.all(buildTargets.map((buildTarget) => execFile(`${__dirname}/build.${buildTarget}.sh`)));

  console.log("build complete");
};

module.exports = build;

if (require.main === module) {
  build();
}
