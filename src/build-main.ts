import { build as buildMarkdown } from "./build-legacy-markdown";
import { build as buildGhpages } from "./build-ghpages";

export const build = async () => {
  await Promise.all([buildGhpages()]);
  console.log("build complete");
};

if (import.meta.main) {
  await build();
}
