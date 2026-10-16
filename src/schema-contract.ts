import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const dialect = "https://meta.json-schema.tools/";

interface SchemaIdentity {
  $id?: unknown;
  $schema?: unknown;
  properties?: { $schema?: { default?: unknown } };
}

export const checkSchemaContract = (
  specDir = join(import.meta.dir, "..", "spec"),
): string[] => {
  const errors: string[] = [];
  const versions = readdirSync(specDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d+\.\d+$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  const ids = new Map<string, string>();

  if (versions.length === 0) {
    errors.push("No compatibility version directories found.");
  }

  for (const version of versions) {
    const path = join(specDir, version, "schema.json");
    const expectedId = `https://schema.open-rpc.org/${version}`;
    let schema: SchemaIdentity;

    try {
      const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
      if (
        parsed === null ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        throw new Error("Expected a schema object.");
      }
      schema = parsed;
    } catch (error) {
      errors.push(`${path}: cannot read schema: ${String(error)}`);
      continue;
    }

    if (schema.$id !== expectedId) {
      errors.push(
        `${path}: expected $id ${expectedId}, received ${JSON.stringify(schema.$id)}.`,
      );
    }
    if (schema.properties?.$schema?.default !== expectedId) {
      errors.push(`${path}: document $schema default must be ${expectedId}.`);
    }
    if (schema.$schema !== dialect) {
      errors.push(`${path}: top-level $schema dialect must remain ${dialect}.`);
    }
    if (typeof schema.$id === "string") {
      const previous = ids.get(schema.$id);
      if (previous !== undefined) {
        errors.push(
          `${path}: duplicate $id ${schema.$id}, also used by ${previous}.`,
        );
      }
      ids.set(schema.$id, path);
    }
  }

  return errors;
};

if (import.meta.main) {
  const errors = checkSchemaContract();
  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else {
    // eslint-disable-next-line no-console
    console.log("Schema contract passed for all compatibility versions.");
  }
}
