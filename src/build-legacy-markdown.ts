import fsx from "fs-extra";
import toc from "markdown-toc";
import { readFile, writeFile } from "fs/promises";
import { getPackageVersion } from "./version";

const specVersion = getPackageVersion();

const replaceVersionComments = (s: string): string =>
  s.replace("<!-- version -->", `Version ${specVersion}`);

export const build = async () => {
  const buildDir = "./build/markdown/";
  await fsx.ensureDir(buildDir);
  await fsx.emptyDir(buildDir);
  const specContent = await readFile("./spec/legacy/spec.md", "utf8");
  const withToc = toc.insert(specContent);
  const withVersion = replaceVersionComments(withToc);
  await writeFile(`${buildDir}/spec.md`, withVersion);

  console.log("building markdown complete. Markdown is ready to be released!");

  return true;
};

if (import.meta.main) {
  await build();
}
