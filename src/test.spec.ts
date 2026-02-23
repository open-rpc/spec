import { describe, it, expect } from "bun:test";
import { Glob } from "bun";
import Dereferencer from "@json-schema-tools/dereferencer";

const glob = new Glob("spec/**/schema.json");
const schemaFiles = Array.from(glob.scanSync({ cwd: "." }));

describe.each(schemaFiles)("%s", (schemaPath) => {
  it("is valid JSON", async () => {
    const schema = await Bun.file(schemaPath).json();
    expect(schema).toBeTruthy();
  });

  it("can be fully dereferenced", async () => {
    const schema = await Bun.file(schemaPath).json();
    const deref = new Dereferencer(schema);
    const resolved = await deref.resolve();
    expect(resolved).toBeTruthy();
    expect(resolved.definitions).not.toBeDefined();
  });

  it("contains referenceObject and methodObject in methods", async () => {
    const schema = await Bun.file(schemaPath).json();
    const deref = new Dereferencer(schema);
    const resolved = await deref.resolve();

    const methodOneOf = resolved.properties.methods.items.oneOf;
    const titles = methodOneOf.map((s: { title: string }) => s.title);
    expect(titles).toContain("methodObject");
    expect(titles).toContain("referenceObject");
  });
});
