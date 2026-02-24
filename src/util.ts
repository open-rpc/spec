import type {
  Table,
  TableRow,
  TableCell,
  PhrasingContent,
  Paragraph,
  Html,
  Text,
  InlineCode,
  Link,
  Strong,
  Heading,
  Root,
} from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import { gfm } from "micromark-extension-gfm";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfmTableToMarkdown } from "mdast-util-gfm-table";

// --- Helpers ---

/** camelCase → kebab-case */
export const toKebabCase = (str: string): string =>
  str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

/** camelCase → Title Case */
export const toTitleCase = (str: string): string =>
  str.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (s) => s.toUpperCase());

/** Generate anchor from schema title + field name */
export const makeAnchor = (
  schemaTitleRaw: string,
  fieldName: string,
): string => {
  const prefix = toKebabCase(schemaTitleRaw).replace(/-?object$/, "");
  return `${prefix}-${toKebabCase(fieldName)}`;
};

/** Parse markdown string into phrasing content nodes */
export const parseMarkdownInline = (md: string): PhrasingContent[] => {
  if (!md) return [];

  const tree = fromMarkdown(md, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });

  // Extract phrasing content from first paragraph
  // (table cells can only contain inline/phrasing content)
  const para = tree.children.find(
    (n): n is Paragraph => n.type === "paragraph",
  );
  return para?.children ?? [text(md)];
};

// --- mdast Node Builders ---

export const text = (value: string): Text => ({ type: "text", value });

export const html = (value: string): Html => ({ type: "html", value });

export const inlineCode = (value: string): InlineCode => ({
  type: "inlineCode",
  value,
});

export const strong = (children: PhrasingContent[]): Strong => ({
  type: "strong",
  children,
});

export const link = (url: string, children: PhrasingContent[]): Link => ({
  type: "link",
  url,
  children,
});

export const tableCell = (children: PhrasingContent[]): TableCell => ({
  type: "tableCell",
  children,
});

export const tableRow = (cells: TableCell[]): TableRow => ({
  type: "tableRow",
  children: cells,
});

export const heading = (
  depth: 1 | 2 | 3 | 4 | 5 | 6,
  value: string,
): Heading => ({
  type: "heading",
  depth,
  children: [text(value)],
});

// --- Type Rendering ---

export interface TypeInfo {
  title?: string;
  type?: string;
  items?: TypeInfo;
  oneOf?: TypeInfo[];
  properties?: Record<string, unknown>;
  patternProperties?: Record<string, TypeInfo>;
}

export type TypeKind =
  | { kind: "primitive"; type: string }
  | { kind: "object"; title: string }
  | { kind: "array"; items: TypeInfo }
  | { kind: "map"; valueType: TypeInfo }
  | { kind: "oneOf"; variants: TypeInfo[] }
  | { kind: "unknown" };

export const computeTypeKind = (schema: TypeInfo): TypeKind => {
  // 1. oneOf - union type
  if (schema.oneOf && schema.oneOf.length > 0) {
    return { kind: "oneOf", variants: schema.oneOf };
  }

  // 2. Array type
  if (schema.type === "array" && schema.items) {
    return { kind: "array", items: schema.items };
  }

  // 3. Map type (object with patternProperties, excluding ^x-)
  if (schema.type === "object" && schema.patternProperties) {
    const patterns = Object.entries(schema.patternProperties).filter(
      ([k]) => k !== "^x-",
    );
    if (patterns.length > 0) {
      return { kind: "map", valueType: patterns[0][1] };
    }
  }

  // 4. Object with properties → link to it
  if (schema.properties && schema.title) {
    return { kind: "object", title: schema.title };
  }

  // 5. Primitive type (string, integer, boolean, number)
  if (schema.type && !schema.properties) {
    return { kind: "primitive", type: schema.type };
  }

  // 6. Title without properties - check if it looks like a primitive
  // (e.g., infoObjectTitle has title but type: "string")
  if (
    schema.title &&
    schema.type &&
    ["string", "integer", "boolean", "number"].includes(schema.type)
  ) {
    return { kind: "primitive", type: schema.type };
  }

  // 7. Title only with no structural type info: do not infer linkable object
  if (schema.title) {
    return { kind: "unknown" };
  }

  return { kind: "unknown" };
};

export const renderType = (schema: TypeInfo): PhrasingContent[] => {
  const typeKind = computeTypeKind(schema);

  switch (typeKind.kind) {
    case "primitive":
      return [inlineCode(typeKind.type)];

    case "object": {
      const display = toTitleCase(typeKind.title);
      const anchor = `#${toKebabCase(typeKind.title)}`;
      return [link(anchor, [text(display)])];
    }

    case "array":
      return [text("["), ...renderType(typeKind.items), text("]")];

    case "map":
      return [
        text("Map["),
        inlineCode("string"),
        text(", "),
        ...renderType(typeKind.valueType),
        text("]"),
      ];

    case "oneOf": {
      const parts: PhrasingContent[] = [];
      typeKind.variants.forEach((v, i) => {
        if (i > 0) parts.push(text(" | "));
        parts.push(...renderType(v));
      });
      return parts;
    }

    default:
      return [text("unknown")];
  }
};

// --- Table Building ---

export interface FieldDef {
  name: string;
  schema: TypeInfo;
  description?: string;
  required: boolean;
}

export const buildFieldCell = (
  schemaTitleRaw: string,
  fieldName: string,
): TableCell => {
  const anchor = makeAnchor(schemaTitleRaw, fieldName);
  return tableCell([html(`<a name="${anchor}"></a>`), text(fieldName)]);
};

export const buildTypeCell = (schema: TypeInfo): TableCell => {
  return tableCell(renderType(schema));
};

export const buildDescriptionCell = (
  description: string | undefined,
  required: boolean,
): TableCell => {
  const children: PhrasingContent[] = [];
  if (required) {
    children.push(strong([text("REQUIRED")]), text(". "));
  }
  children.push(...parseMarkdownInline(description ?? ""));
  return tableCell(children);
};

export const buildTableRow = (
  schemaTitleRaw: string,
  field: FieldDef,
): TableRow => {
  return tableRow([
    buildFieldCell(schemaTitleRaw, field.name),
    buildTypeCell(field.schema),
    buildDescriptionCell(field.description, field.required),
  ]);
};

export const buildTable = (
  schemaTitleRaw: string,
  fields: FieldDef[],
): Table => {
  const headerRow = tableRow([
    tableCell([text("Field Name")]),
    tableCell([text("Type")]),
    tableCell([text("Description")]),
  ]);

  return {
    type: "table",
    align: ["left", "center", "left"],
    children: [
      headerRow,
      ...fields.map((f) => buildTableRow(schemaTitleRaw, f)),
    ],
  };
};

// --- Render ---

export const renderTable = (table: Table): string => {
  return toMarkdown(table, { extensions: [gfmTableToMarkdown()] });
};

// --- Section Rendering ---

export interface Section {
  title: string;
  schemaTitleRaw: string;
  fields: FieldDef[];
  headingDepth: 1 | 2 | 3 | 4 | 5 | 6;
  description?: string;
  hasSpecExtensions?: boolean;
}

export const renderSections = (sections: Section[]): string => {
  const children = sections.flatMap(
    ({
      title,
      schemaTitleRaw,
      fields,
      headingDepth,
      description,
      hasSpecExtensions,
    }) => {
      const nodes: (Heading | Paragraph | Table)[] = [
        heading(headingDepth, title),
      ];

      if (description) {
        nodes.push({
          type: "paragraph",
          children: parseMarkdownInline(description),
        });
      }

      nodes.push(buildTable(schemaTitleRaw, fields));

      if (hasSpecExtensions) {
        nodes.push({
          type: "paragraph",
          children: parseMarkdownInline(
            "This object MAY be extended with [Specification Extensions](#specification-extensions).",
          ),
        });
      }

      return nodes;
    },
  );
  const root: Root = { type: "root", children };
  return toMarkdown(root, { extensions: [gfmTableToMarkdown()] });
};
