#!/usr/bin/env node

const {promisify} = require("util");

const readdir = promisify(require("fs").readdir);
const execFile = promisify(require('child_process').execFile);
const fsx = require("fs-extra");

const build = async () => {
  const buildScriptFilenames = await readdir(__dirname);

  const buildTargets = buildScriptFilenames
        .filter((filename) => filename.includes("build.") && filename !== "build.sh")
        .map((filename) => filename.split(".")[1]);

  buildTargets.forEach(async (buildTarget) => {
    await require(`${__dirname}/build.${buildTarget}.sh`)();
  });

  console.log("build complete");
};

module.exports = build;

if (require.main === module) {
  build();
}
