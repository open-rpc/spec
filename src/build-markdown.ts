import * as fs from "fs";
import Dereferencer from "@json-schema-tools/dereferencer";
import {
  FieldDef,
  TypeInfo,
  Section,
  renderSections,
  toTitleCase,
} from "./util";
import toc from "markdown-toc";

const replaceVersionComments = (s: string, version: string): string =>
  s.replace("<!-- version -->", `Version ${version}`);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getDereffedSchema = async (path: string): Promise<any> => {
  let raw = "";
  try {
    raw = fs.readFileSync(path, "utf8");
    const s = JSON.parse(raw);
    const deref = new Dereferencer(s);
    const dereffed = await deref.resolve();
    return dereffed;
  } catch (e) {
    console.error(
      `Cannot parse meta-schema or dereference it. ${e instanceof Error ? e.message : "Unknown error"} Recieved: ${raw}`,
    );
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractFields = (schema: any): FieldDef[] => {
  const properties = schema.properties || {};
  const requiredFields: string[] = schema.required || [];

  return Object.entries(properties).map(([name, propSchema]) => {
    const ps = propSchema as TypeInfo & { description?: string };
    return {
      name,
      schema: {
        title: ps.title,
        type: ps.type,
        items: ps.items,
        oneOf: ps.oneOf,
        properties: ps.properties,
        patternProperties: ps.patternProperties,
      },
      description: ps.description,
      required: requiredFields.includes(name),
    };
  });
};

const collectSections = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: any,
  depth: number,
  visited: Set<string>,
  excludeTitles: Set<string>,
): Section[] => {
  const title = schema.title || "object";
  if (visited.has(title)) return [];
  if (excludeTitles.has(title)) {
    visited.add(title);
    return [];
  }
  visited.add(title);

  const fields = extractFields(schema);
  if (fields.length === 0) return [];

  // Cap at h6 for markdown
  const headingDepth = Math.min(depth + 1, 6) as 1 | 2 | 3 | 4 | 5 | 6;

  // Start with current section
  const sections: Section[] = [
    {
      title: toTitleCase(title),
      schemaTitleRaw: title,
      fields,
      headingDepth,
      description: schema.description,
      hasSpecExtensions: schema.patternProperties?.["^x-"] !== undefined,
    },
  ];

  // Depth-first: immediately recurse into each child before moving to next sibling
  for (const field of fields) {
    const propSchema = schema.properties?.[field.name];

    // Direct object with properties
    if (propSchema?.properties) {
      sections.push(
        ...collectSections(propSchema, depth + 1, visited, excludeTitles),
      );
    }
    // Array items with properties
    else if (propSchema?.items?.properties) {
      sections.push(
        ...collectSections(propSchema.items, depth + 1, visited, excludeTitles),
      );
    }
    // Array items with oneOf
    else if (propSchema?.items?.oneOf) {
      for (const variant of propSchema.items.oneOf) {
        if (variant?.properties) {
          sections.push(
            ...collectSections(variant, depth + 1, visited, excludeTitles),
          );
        }
      }
    }
    // Direct oneOf - traverse each variant
    else if (propSchema?.oneOf) {
      for (const variant of propSchema.oneOf) {
        if (variant?.properties) {
          sections.push(
            ...collectSections(variant, depth + 1, visited, excludeTitles),
          );
        }
      }
    }

    // patternProperties - traverse values that are objects (skip ^x- extensions)
    if (propSchema?.patternProperties) {
      for (const [pattern, patternValue] of Object.entries(
        propSchema.patternProperties,
      )) {
        if (pattern === "^x-") continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pv = patternValue as any;
        if (pv?.properties) {
          sections.push(
            ...collectSections(pv, depth + 1, visited, excludeTitles),
          );
        }
      }
    }
  }
  return sections;
};

const parseVersionFromPath = (path: string): string => {
  const versionMatch = path.match(/\/spec\/([\d.]+)\//);
  const version = versionMatch ? versionMatch[1] : null;
  if (!version) throw new Error(`Version not found in path: ${path}`);

  return version;
};

export const build = async (path: string): Promise<string> => {
  const schemaPath = path;
  const version = parseVersionFromPath(schemaPath);

  const schema = await getDereffedSchema(schemaPath);
  if (!schema) throw new Error(`Schema not found in path: ${schemaPath}`);

  const excludedTitles = new Set(["JSONSchemaObject"]);
  const sections = collectSections(schema, 0, new Set(), excludedTitles);
  const markdown = renderSections(sections);

  const preamble = fs.readFileSync(
    `./spec/${version}/spec-template.md`,
    "utf8",
  );
  const composed_markdown = `${preamble}\n${markdown}`;
  const withToc = toc.insert(composed_markdown);

  const withVersion = replaceVersionComments(withToc, `${version}.x`);

  return withVersion;
};
