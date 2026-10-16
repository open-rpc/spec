import { appendFileSync, readFileSync } from "fs";
import { spawnSync } from "bun";
import { join } from "path";
import { checkSchemaContract } from "./schema-contract";
import { compareReleaseVersions, selectReleaseSchemas } from "./version";

export const schemaOrigin = "https://schema.open-rpc.org";
export const cacheControl = "public, max-age=60, s-maxage=60, must-revalidate";
export type Metadata = Record<string, string>;
export type AwsCommand = (args: string[]) => Record<string, unknown> | null;
export type HttpRequest = (
  url: string,
  init?: RequestInit,
) => Promise<Response>;

export const readReleaseSource = (
  specDir = "./spec",
  packagePath = "./package.json",
) => {
  const errors = checkSchemaContract(specDir);
  if (errors.length) throw new Error(errors.join("\n"));
  const { version } = JSON.parse(readFileSync(packagePath, "utf8"));
  const selection = selectReleaseSchemas(version, specDir);
  const schemas = selection.versions.map((key) => {
    const path = join(specDir, key, "schema.json");
    return { key, path, body: readFileSync(path, "utf8") };
  });
  return { ...selection, schemas };
};
export type ReleaseSource = ReturnType<typeof readReleaseSource>;

/** Preflight every destination before writing anything, including interrupted releases. */
export const mayPublish = (
  version: string,
  commit: string,
  states: (Metadata | null)[],
) => {
  for (const state of states) {
    if (
      state &&
      (!/^[0-9a-f]{40}$/.test(state["release-commit"] ?? "") ||
        !state["release-version"])
    )
      throw new Error("Existing schema has no valid release metadata");
    if (state) compareReleaseVersions(state["release-version"], version);
  }
  if (
    states.some(
      (state) =>
        state && compareReleaseVersions(state["release-version"], version) > 0,
    )
  ) {
    return false;
  }
  for (const state of states) {
    if (
      state?.["release-version"] === version &&
      state["release-commit"] !== commit
    ) {
      throw new Error(`Release ${version} already belongs to another commit`);
    }
  }
  return true;
};

export const runAws: AwsCommand = (args) => {
  const result = spawnSync([
    "aws",
    ...args,
    "--output",
    "json",
    "--no-cli-pager",
  ]);
  const stderr = result.stderr.toString();
  if (result.exitCode !== 0) {
    if (
      args[0] === "s3api" &&
      args[1] === "head-object" &&
      /\((404|NoSuchKey)\)/.test(stderr)
    ) {
      return null;
    }
    throw new Error(`AWS ${args[0]} ${args[1]} failed: ${stderr}`);
  }
  const stdout = result.stdout.toString().trim();
  return stdout ? JSON.parse(stdout) : {};
};

const verifyObject = async (
  response: Response,
  body: string,
  version: string,
  commit: string,
) => {
  if (
    response.status !== 200 ||
    response.headers.get("content-type")?.split(";")[0] !==
      "application/json" ||
    response.headers.get("cache-control") !== cacheControl ||
    response.headers.get("x-amz-meta-release-version") !== version ||
    response.headers.get("x-amz-meta-release-commit") !== commit ||
    (await response.text()) !== body
  ) {
    throw new Error(
      `Published schema verification failed: ${response.url || response.status}`,
    );
  }
};

/** Also runs inside the Pages deploy job so a Pages-only retry cannot roll back the site. */
export const checkPagesRelease = async (
  source: ReleaseSource,
  commit: string,
  request: HttpRequest = fetch,
) => {
  const response = await request(`${schemaOrigin}/latest`, {
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  if (response.status !== 200)
    throw new Error(`Latest schema returned HTTP ${response.status}`);
  const metadata: Metadata = {
    "release-version": response.headers.get("x-amz-meta-release-version") ?? "",
    "release-commit": response.headers.get("x-amz-meta-release-commit") ?? "",
  };
  if (!mayPublish(source.releaseVersion, commit, [metadata])) return false;
  if (metadata["release-version"] !== source.releaseVersion) {
    throw new Error(
      "This release's schemas have not been deployed; rerun deploy-schema first",
    );
  }
  const latest = source.schemas.find(
    (schema) => schema.key === source.latestVersion,
  )!;
  await verifyObject(response, latest.body, source.releaseVersion, commit);
  return true;
};

export const deploySchemas = async (
  source: ReleaseSource,
  commit: string,
  bucket: string,
  distribution: string,
  aws: AwsCommand = runAws,
  request: HttpRequest = fetch,
) => {
  const latest = source.schemas.find(
    (schema) => schema.key === source.latestVersion,
  )!;
  const objects = [...source.schemas, { ...latest, key: "latest" }];
  const states = objects.map(({ key }) => {
    const head = aws([
      "s3api",
      "head-object",
      "--bucket",
      bucket,
      "--key",
      key,
    ]);
    return head ? ((head.Metadata ?? {}) as Metadata) : null;
  });
  if (!mayPublish(source.releaseVersion, commit, states)) return false;
  for (const { key, path } of objects) {
    aws([
      "s3api",
      "put-object",
      "--bucket",
      bucket,
      "--key",
      key,
      "--body",
      path,
      "--content-type",
      "application/json",
      "--cache-control",
      cacheControl,
      "--metadata",
      `release-version=${source.releaseVersion},release-commit=${commit}`,
    ]);
  }
  // Include every path so a retry also clears caches left by a partially completed run.
  const result = aws([
    "cloudfront",
    "create-invalidation",
    "--distribution-id",
    distribution,
    "--paths",
    ...objects.map(({ key }) => `/${key}`),
  ]);
  const invalidation = result?.Invalidation as { Id?: string } | undefined;
  if (!invalidation?.Id)
    throw new Error("CloudFront returned no invalidation ID");
  aws([
    "cloudfront",
    "wait",
    "invalidation-completed",
    "--distribution-id",
    distribution,
    "--id",
    invalidation.Id,
  ]);
  for (const { key, body } of objects) {
    const response = await request(`${schemaOrigin}/${key}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    await verifyObject(response, body, source.releaseVersion, commit);
  }
  const root = await request(`${schemaOrigin}/`, {
    redirect: "manual",
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  if (root.status !== 302 || root.headers.get("location") !== "/latest") {
    throw new Error("Schema root did not return 302 Location: /latest");
  }
  return true;
};

if (import.meta.main) {
  const source = readReleaseSource();
  if (process.argv.includes("--check")) {
    // eslint-disable-next-line no-console
    console.log(
      `Release ${source.releaseVersion}: ${source.versions.join(", ")}; latest ${source.latestVersion}`,
    );
  } else {
    const commit = process.env.RELEASE_COMMIT ?? "";
    const head = spawnSync(["git", "rev-parse", "HEAD"]);
    if (
      !/^[0-9a-f]{40}$/.test(commit) ||
      head.exitCode !== 0 ||
      head.stdout.toString().trim() !== commit
    ) {
      throw new Error(
        "RELEASE_COMMIT must match the exact checked-out release commit",
      );
    }
    const pages = process.argv.includes("--check-pages");
    const bucket = process.env.SCHEMA_BUCKET;
    const distribution = process.env.SCHEMA_DISTRIBUTION_ID;
    if (!pages && (!bucket || !distribution))
      throw new Error("Missing schema deployment configuration");
    const current = pages
      ? await checkPagesRelease(source, commit)
      : await deploySchemas(source, commit, bucket!, distribution!);
    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(
        process.env.GITHUB_OUTPUT,
        `${pages ? "current" : "published"}=${current}\n`,
      );
    }
    // eslint-disable-next-line no-console
    console.log(
      current
        ? `Verified release ${source.releaseVersion} at ${commit}`
        : "Skipped stale release",
    );
  }
}
