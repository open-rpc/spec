import { afterEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "fs";
import { removeSync } from "fs-extra";
import { tmpdir } from "os";
import { join } from "path";
import {
  cacheControl,
  checkPagesRelease,
  deploySchemas,
  mayPublish,
  readReleaseSource,
  type AwsCommand,
  type HttpRequest,
  type Metadata,
  type ReleaseSource,
} from "./deploy-schema";
import { compareReleaseVersions, selectReleaseSchemas } from "./version";

const commit = "a".repeat(40);
const otherCommit = "b".repeat(40);
const fixtures: string[] = [];
afterEach(() =>
  fixtures.splice(0).forEach((directory) => removeSync(directory)),
);

const sourceFixture = (version = "1.4.2", versions = ["1.3", "1.4", "1.5"]) => {
  const root = mkdtempSync(join(tmpdir(), "openrpc-deploy-"));
  fixtures.push(root);
  const specDir = join(root, "spec");
  mkdirSync(specDir);
  for (const line of versions) {
    mkdirSync(join(specDir, line));
    const id = `https://schema.open-rpc.org/${line}`;
    writeFileSync(
      join(specDir, line, "schema.json"),
      JSON.stringify({
        $id: id,
        $schema: "https://meta.json-schema.tools/",
        properties: { $schema: { default: id } },
        title: line,
      }),
    );
  }
  const packagePath = join(root, "package.json");
  writeFileSync(packagePath, JSON.stringify({ version }));
  return { specDir, packagePath };
};
const metadata = (version = "1.4.2", sha = commit): Metadata => ({
  "release-version": version,
  "release-commit": sha,
});
const schemaResponse = (body: string, state = metadata()) =>
  new Response(body, {
    headers: {
      "content-type": "application/json",
      "cache-control": cacheControl,
      "x-amz-meta-release-version": state["release-version"],
      "x-amz-meta-release-commit": state["release-commit"],
    },
  });

const fakeHosting = (
  source: ReleaseSource,
  initial: Record<string, Metadata> = {},
) => {
  const states = new Map(Object.entries(initial));
  const calls: string[][] = [];
  const events: string[] = [];
  let failUpload = "";
  let failWait = false;
  const aws: AwsCommand = (args) => {
    calls.push(args);
    events.push(`${args[0]} ${args[1]}`);
    const key = args[args.indexOf("--key") + 1];
    if (args[1] === "head-object")
      return states.has(key) ? { Metadata: states.get(key) } : null;
    if (args[1] === "put-object") {
      if (key === failUpload) throw new Error("upload failed");
      const value = args[args.indexOf("--metadata") + 1];
      states.set(
        key,
        Object.fromEntries(value.split(",").map((entry) => entry.split("="))),
      );
    }
    if (args[1] === "create-invalidation")
      return { Invalidation: { Id: "I-test" } };
    if (args[0] === "cloudfront" && args[1] === "wait" && failWait) {
      failWait = false;
      throw new Error("invalidation wait failed");
    }
    return {};
  };
  const request: HttpRequest = async (url) => {
    const key = new URL(url).pathname.slice(1);
    events.push(`HTTP ${key || "/"}`);
    if (!key)
      return new Response(null, {
        status: 302,
        headers: { location: "/latest" },
      });
    const schema = source.schemas.find(
      (entry) => entry.key === (key === "latest" ? source.latestVersion : key),
    )!;
    return schemaResponse(schema.body, states.get(key));
  };
  return {
    aws,
    request,
    calls,
    events,
    states,
    failUpload: (key: string) => {
      failUpload = key;
    },
    failWaitOnce: () => {
      failWait = true;
    },
    writes: () =>
      calls
        .filter((args) => args[1] === "put-object")
        .map((args) => args[args.indexOf("--key") + 1]),
  };
};

describe("released schema selection", () => {
  it("keeps a future folder out of a patch release and its latest selection", () => {
    const { specDir } = sourceFixture();
    expect(selectReleaseSchemas("1.4.2", specDir)).toEqual({
      releaseVersion: "1.4.2",
      latestVersion: "1.4",
      versions: ["1.3", "1.4"],
    });
  });
  it("compares versions numerically across minors and majors", () => {
    const { specDir } = sourceFixture("1.10.1", ["1.3", "1.9", "1.10", "2.0"]);
    expect(selectReleaseSchemas("1.10.1", specDir).versions).toEqual([
      "1.3",
      "1.9",
      "1.10",
    ]);
    expect(compareReleaseVersions("1.10.0", "1.9.99")).toBeGreaterThan(0);
  });
  it("requires the package's matching compatibility line", () => {
    const { specDir } = sourceFixture("1.4.2", ["1.3"]);
    expect(() => selectReleaseSchemas("1.4.2", specDir)).toThrow(
      "requires spec/1.4/schema.json",
    );
  });
  it("rejects prereleases before they can promote latest", () => {
    const { specDir } = sourceFixture();
    expect(() => selectReleaseSchemas("1.5.0-rc.1", specDir)).toThrow(
      "stable release version",
    );
  });
});

describe("schema deployment", () => {
  const source = () => {
    const fixture = sourceFixture();
    return readReleaseSource(fixture.specDir, fixture.packagePath);
  };
  it("preflights all destinations, writes version keys before latest, then invalidates and verifies", async () => {
    const release = source();
    const hosting = fakeHosting(release);
    expect(
      await deploySchemas(
        release,
        commit,
        "bucket",
        "distribution",
        hosting.aws,
        hosting.request,
      ),
    ).toBe(true);
    expect(hosting.writes()).toEqual(["1.3", "1.4", "latest"]);
    expect(hosting.calls.slice(0, 3).map((args) => args[1])).toEqual([
      "head-object",
      "head-object",
      "head-object",
    ]);
    expect(hosting.states.get("latest")).toEqual(metadata());
    expect(hosting.events.indexOf("cloudfront wait")).toBeLessThan(
      hosting.events.indexOf("HTTP 1.3"),
    );
    for (const args of hosting.calls.filter(
      (args) => args[1] === "put-object",
    )) {
      expect(args[args.indexOf("--content-type") + 1]).toBe("application/json");
      expect(args[args.indexOf("--cache-control") + 1]).toBe(cacheControl);
    }
  });
  it("skips an older release before any write when latest is newer", async () => {
    const release = source();
    const hosting = fakeHosting(release, {
      latest: metadata("1.4.3", otherCommit),
    });
    expect(
      await deploySchemas(
        release,
        commit,
        "bucket",
        "distribution",
        hosting.aws,
        hosting.request,
      ),
    ).toBe(false);
    expect(hosting.writes()).toEqual([]);
    expect(hosting.calls.every((args) => args[1] === "head-object")).toBe(true);
  });
  it("also blocks stale writes after a newer release failed before promoting latest", async () => {
    const release = source();
    const hosting = fakeHosting(release, {
      "1.3": metadata("1.4.3", otherCommit),
      latest: metadata("1.4.1"),
    });
    expect(
      await deploySchemas(
        release,
        commit,
        "bucket",
        "distribution",
        hosting.aws,
        hosting.request,
      ),
    ).toBe(false);
    expect(hosting.writes()).toEqual([]);
  });
  it("does not replace another commit using the same package version", async () => {
    const release = source();
    const hosting = fakeHosting(release, {
      latest: metadata("1.4.2", otherCommit),
    });
    await expect(
      deploySchemas(
        release,
        commit,
        "bucket",
        "distribution",
        hosting.aws,
        hosting.request,
      ),
    ).rejects.toThrow("another commit");
    expect(hosting.writes()).toEqual([]);
  });
  it("fails closed when existing objects lack valid release metadata", () => {
    expect(() => mayPublish("1.4.2", commit, [{}])).toThrow("release metadata");
    expect(() => mayPublish("1.4.2", commit, [metadata("invalid")])).toThrow(
      "stable release",
    );
  });
  it("propagates AWS read errors before any upload", async () => {
    const release = source();
    const hosting = fakeHosting(release);
    const denied: AwsCommand = () => {
      throw new Error("AccessDenied");
    };
    await expect(
      deploySchemas(
        release,
        commit,
        "bucket",
        "distribution",
        denied,
        hosting.request,
      ),
    ).rejects.toThrow("AccessDenied");
    expect(hosting.writes()).toEqual([]);
  });
  it("leaves latest untouched when a version upload fails", async () => {
    const release = source();
    const hosting = fakeHosting(release, { latest: metadata("1.4.1") });
    hosting.failUpload("1.4");
    await expect(
      deploySchemas(
        release,
        commit,
        "bucket",
        "distribution",
        hosting.aws,
        hosting.request,
      ),
    ).rejects.toThrow("upload failed");
    expect(hosting.states.get("latest")?.["release-version"]).toBe("1.4.1");
    expect(hosting.writes()).not.toContain("latest");
  });
  it("can retry the same commit after invalidation fails, clearing every version path again", async () => {
    const release = source();
    const hosting = fakeHosting(release);
    hosting.failWaitOnce();
    await expect(
      deploySchemas(
        release,
        commit,
        "bucket",
        "distribution",
        hosting.aws,
        hosting.request,
      ),
    ).rejects.toThrow("invalidation wait failed");
    expect(
      await deploySchemas(
        release,
        commit,
        "bucket",
        "distribution",
        hosting.aws,
        hosting.request,
      ),
    ).toBe(true);
    const invalidations = hosting.calls.filter(
      (args) => args[1] === "create-invalidation",
    );
    expect(invalidations).toHaveLength(2);
    expect(
      invalidations[1].slice(invalidations[1].indexOf("--paths") + 1),
    ).toEqual(["/1.3", "/1.4", "/latest"]);
  });
  it("rejects a public response whose bytes differ from the release source", async () => {
    const release = source();
    const hosting = fakeHosting(release);
    await expect(
      deploySchemas(
        release,
        commit,
        "bucket",
        "distribution",
        hosting.aws,
        async () => schemaResponse("{}"),
      ),
    ).rejects.toThrow("verification failed");
  });
  it("rejects stale metadata even when schema bytes happen to be unchanged", async () => {
    const release = source();
    const hosting = fakeHosting(release);
    await expect(
      deploySchemas(
        release,
        commit,
        "bucket",
        "distribution",
        hosting.aws,
        async () => schemaResponse(release.schemas[0].body, metadata("1.4.1")),
      ),
    ).rejects.toThrow("verification failed");
  });
  it("requires the root's exact redirect", async () => {
    const release = source();
    const hosting = fakeHosting(release);
    const request: HttpRequest = (url, init) =>
      url.endsWith("/")
        ? Promise.resolve(new Response(null, { status: 200 }))
        : hosting.request(url, init);
    await expect(
      deploySchemas(
        release,
        commit,
        "bucket",
        "distribution",
        hosting.aws,
        request,
      ),
    ).rejects.toThrow("302 Location");
  });
});

describe("Pages retry freshness", () => {
  const source = () => {
    const fixture = sourceFixture();
    return readReleaseSource(fixture.specDir, fixture.packagePath);
  };
  const latestBody = (release: ReleaseSource) =>
    release.schemas.find((schema) => schema.key === release.latestVersion)!
      .body;
  it("permits Pages for the exact published release commit", async () => {
    const release = source();
    expect(
      await checkPagesRelease(release, commit, async () =>
        schemaResponse(latestBody(release)),
      ),
    ).toBe(true);
  });
  it("skips a Pages-only retry after a newer release was deployed", async () => {
    const release = source();
    expect(
      await checkPagesRelease(release, commit, async () =>
        schemaResponse("{}", metadata("1.5.0", otherCommit)),
      ),
    ).toBe(false);
  });
  it("blocks Pages when its release has not yet been published", async () => {
    const release = source();
    await expect(
      checkPagesRelease(release, commit, async () =>
        schemaResponse(latestBody(release), metadata("1.4.1")),
      ),
    ).rejects.toThrow("not been deployed");
  });
  it("rejects another commit claiming the same version", async () => {
    const release = source();
    await expect(
      checkPagesRelease(release, commit, async () =>
        schemaResponse(latestBody(release), metadata("1.4.2", otherCommit)),
      ),
    ).rejects.toThrow("another commit");
  });
  it("fails closed if the public deployment marker is missing or unavailable", async () => {
    const release = source();
    await expect(
      checkPagesRelease(release, commit, async () => new Response("{}")),
    ).rejects.toThrow("release metadata");
    await expect(
      checkPagesRelease(
        release,
        commit,
        async () => new Response(null, { status: 403 }),
      ),
    ).rejects.toThrow("HTTP 403");
  });
});
