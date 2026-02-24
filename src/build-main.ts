import { build as buildGhpages } from "./build-ghpages";

export const build = async () => {
  await Promise.all([buildGhpages()]);
  // eslint-disable-next-line no-console
  console.log("build complete");
};

if (import.meta.main) {
  await build();
}
