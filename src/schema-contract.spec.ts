import { afterEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "fs";
import { removeSync } from "fs-extra";
import { tmpdir } from "os";
import { join } from "path";
import { checkSchemaContract } from "./schema-contract";

const fixtures: string[] = [];
const fixture = (): string => {
  const directory = mkdtempSync(join(tmpdir(), "openrpc-schema-contract-"));
  fixtures.push(directory);
  return directory;
};

const writeSchema = (
  root: string,
  version: string,
  overrides: Record<string, unknown> = {},
) => {
  const id = `https://schema.open-rpc.org/${version}`;
  const directory = join(root, version);
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    join(directory, "schema.json"),
    JSON.stringify({
      $id: id,
      $schema: "https://meta.json-schema.tools/",
      properties: { $schema: { default: id } },
      ...overrides,
    }),
  );
};

afterEach(() => {
  for (const directory of fixtures.splice(0)) {
    removeSync(directory);
  }
});

describe("schema contract", () => {
  it("discovers compatibility directories, including future versions", () => {
    const root = fixture();
    for (const version of ["1.3", "1.4", "1.5"]) {
      writeSchema(root, version);
    }
    writeFileSync(join(root, "README.md"), "Not a schema.");
    expect(checkSchemaContract(root)).toEqual([]);
  });

  it("rejects the legacy ID even if the document default is correct", () => {
    const root = fixture();
    writeSchema(root, "1.4", { $id: "https://meta.open-rpc.org/" });
    expect(checkSchemaContract(root).join("\n")).toContain(
      "expected $id https://schema.open-rpc.org/1.4",
    );
  });

  it("rejects a trailing slash on the canonical ID", () => {
    const root = fixture();
    writeSchema(root, "1.4", { $id: "https://schema.open-rpc.org/1.4/" });
    expect(checkSchemaContract(root).join("\n")).toContain("expected $id");
  });

  it("rejects a document default pointing at a different version", () => {
    const root = fixture();
    writeSchema(root, "1.4", {
      properties: { $schema: { default: "https://schema.open-rpc.org/1.3" } },
    });
    expect(checkSchemaContract(root).join("\n")).toContain(
      "document $schema default",
    );
  });

  it("rejects a missing document default", () => {
    const root = fixture();
    writeSchema(root, "1.4", { properties: {} });
    expect(checkSchemaContract(root).join("\n")).toContain(
      "document $schema default",
    );
  });

  it("reports duplicate IDs across versions", () => {
    const root = fixture();
    writeSchema(root, "1.3");
    writeSchema(root, "1.4", { $id: "https://schema.open-rpc.org/1.3" });
    expect(checkSchemaContract(root).join("\n")).toContain("duplicate $id");
  });

  it("rejects a version directory with no schema file", () => {
    const root = fixture();
    writeSchema(root, "1.3");
    mkdirSync(join(root, "1.4"));
    expect(checkSchemaContract(root).join("\n")).toContain(
      "1.4/schema.json: cannot read schema",
    );
  });

  it("rejects a source tree without any compatibility versions", () => {
    expect(checkSchemaContract(fixture())).toEqual([
      "No compatibility version directories found.",
    ]);
  });

  it("reports malformed JSON", () => {
    const root = fixture();
    writeSchema(root, "1.4");
    writeFileSync(join(root, "1.4", "schema.json"), "{");
    expect(checkSchemaContract(root).join("\n")).toContain(
      "cannot read schema",
    );
  });

  it("rejects a schema that is not an object", () => {
    const root = fixture();
    writeSchema(root, "1.4");
    writeFileSync(join(root, "1.4", "schema.json"), "null");
    expect(checkSchemaContract(root).join("\n")).toContain(
      "Expected a schema object",
    );
  });

  it("preserves the top-level dialect separately from the document default", () => {
    const root = fixture();
    writeSchema(root, "1.4", { $schema: "https://schema.open-rpc.org/1.4" });
    expect(checkSchemaContract(root).join("\n")).toContain(
      "top-level $schema dialect must remain",
    );
  });
});
