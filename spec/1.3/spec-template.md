# OpenRPC Specification

<!-- version -->

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [BCP 14](https://tools.ietf.org/html/bcp14) [RFC2119](https://tools.ietf.org/html/rfc2119) [RFC8174](https://tools.ietf.org/html/rfc8174) when, and only when, they appear in all capitals, as shown here.

In the following description, if a field is not explicitly **REQUIRED** or described with a MUST or SHALL, it can be considered OPTIONAL.

This document is licensed under [The Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0.html).

<!-- toc -->
<!-- tocstop -->

# Introduction

The OpenRPC Specification defines a standard, programming language-agnostic interface description for [JSON-RPC 2.0 APIs](https://www.jsonrpc.org/specification), which allows both humans and computers to discover and understand the capabilities of a service without requiring access to source code, additional documentation, or inspection of network traffic. When properly defined via OpenRPC, a consumer can understand and interact with the remote service with a minimal amount of implementation logic. Similar to what interface descriptions have done for lower-level programming, the OpenRPC Specification removes guesswork in calling a service.

Use cases for machine-readable JSON-RPC API definition documents include, but are not limited to:

- interactive documentation
- code generation for documentation
- clients
- servers
- automation of test cases.

OpenRPC documents describe a JSON-RPC APIs services and are represented in JSON format. These documents may either be produced and served statically or be generated dynamically from an application.

The OpenRPC Specification does not require rewriting existing JSON-RPC APIs. It does not require binding any software to a service — the service being described may not even be owned by the creator of its description. It does, however, require the capabilities of the service be described in the structure of the OpenRPC Specification. Not all services can be described by OpenRPC — this specification is not intended to cover REST APIs - It is exclusively for APIs which adhere to the JSON-RPC 2.0 spec. The OpenRPC Specification does not mandate a specific development process such as design-first or code-first. It does facilitate either technique by establishing clear interactions with a JSON-RPC API.

# Definitions

## OpenRPC Document

A document (or set of documents) that defines or describes an API. An OpenRPC document uses and conforms to the OpenRPC Specification.

## Patterned Field

A field (key value pair) where the key name is supplied by the user, and the value is defined by the specification for the patterned field. The Field Pattern is a Regular expression.

## Regular Expression

Regular expressions within the OpenRPC specification and tooling is RECOMMENDED to be a [Perl Compatible Regular Expressions](https://www.pcre.org/). That being said, tooling implementers SHOULD adhere to [ECMA-262 6th Edition Regular Expressions](https://www.ecma-international.org/ecma-262/6.0/#sec-regexp-regular-expression-objects).

## Runtime Expression

Runtime expressions allow the user to define an expression which will evaluate to a string once the desired value(s) are known. They are used when the desired value of a link or server can only be constructed at run time.
This mechanism is used by [Link Objects](#link-object) and [Server Variables](#server-variables).

The runtime expression makes use of [JSON Template Language](https://tools.ietf.org/html/draft-jonas-json-template-language-01) syntax.

The table below provides examples of runtime expressions and examples of their use in a value:

Runtime expressions preserve the type of the referenced value.

## Specification Extensions

While the OpenRPC Specification tries to accommodate most use cases, additional data can be added to extend the specification at certain points.

The extensions properties are implemented as patterned fields that are always prefixed by `"x-"`.

| Field Pattern                     | Type | Description                                                                                                                                                                                                    |
| --------------------------------- | :--: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a name="info-extensions"></a>^x- | Any  | Allows extensions to the OpenRPC Schema. The field name MUST begin with `x-`, for example, `x-internal-id`. The value can be `null`, a primitive, an array or an object. Can have any valid JSON format value. |

The extensions may or may not be supported by the available tooling, but those may be extended as well to add requested support (if tools are internal or open-sourced).

## Official OpenRPC Tooling

Tooling that is built, maintained and documented by the OpenRPC organization. It is meant to be used as a functional reference implementation of the Specification. Users of the OpenRPC Specification are encouraged to create versions of the tooling as their own organization/projects.

# Versions

The OpenRPC Specification is versioned using [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

The `major.minor` portion of the semver (for example `1.0.x`) SHALL designate the OpenRPC feature set. Typically, `.patch` versions address errors in this document, not the feature set. Tooling which supports OpenRPC 1.0.0 SHOULD be compatible with all OpenRPC `1.0.x` versions. The patch version SHOULD NOT be considered by tooling, making no distinction between `1.0.0` and `1.0.1` for example.

Subsequent minor version releases of the OpenRPC Specification (incrementing the `minor` version number) SHOULD NOT interfere with tooling developed to a lower minor version and same major version. Thus a hypothetical `1.1.0` specification SHOULD be usable with tooling designed for `1.0.0`.

An OpenRPC document compatible with OpenRPC 1.0.0 contains a required [`openrpc`](#openrpc-document-openrpc) field which designates the semantic version of the OpenRPC that it uses.

# Format

An OpenRPC document that conforms to the OpenRPC Specification is itself a JSON object, which must be represented in JSON format. Due to the nature of JSON-RPC APIs using JSON formats, strictly use JSON only [as described here](https://tools.ietf.org/html/rfc7159). If you wish to use any other format than JSON, it should be converted outside of any OpenRPC tooling.

It is RECOMMENDED that the OpenRPC document be named: `openrpc.json`. Tooling that requires an OpenRPC document as input MAY assume the default document location to be `./openrpc.json`, where the `./` represents the current working directory.

All field names in the specification are **case sensitive**. [CamelCase](https://trac.tools.ietf.org/group/tools/trac/wiki/CamelCase) SHOULD be used for all key names.
This includes all fields that are used as keys in a map, except where explicitly noted that keys are **case insensitive**.

[According to the JSON specification for objects](https://tools.ietf.org/html/rfc7159#section-4), key names SHOULD be unique. However, To avoid ambiguity, all [patterned fields](#patterned-field) in an OpenRPC document MUST have unique key names within the containing object.

# Rich Text Formatting

Throughout the specification `description` fields are noted as supporting Github markdown formatting.
Where OpenRPC tooling renders rich text it MUST support, at a minimum, markdown syntax as described by [GitHub Flavored Markdown](https://github.github.com/gfm/). Tooling MAY choose to ignore some GitHub Flavored Markdown features to address security concerns.

# Service Discovery Method

JSON-RPC APIs can support the OpenRPC specification by implementing a service discovery method that will return the OpenRPC schema for the JSON-RPC API. The method MUST be named `rpc.discover`. The `rpc.` prefix is a reserved method prefix for JSON-RPC 2.0 specification system extensions. Below is the OpenRPC specification for the service discovery method:

```json
{
  "methods": [
    {
      "name": "rpc.discover",
      "description": "Returns an OpenRPC schema as a description of this service",
      "params": [],
      "result": {
        "name": "OpenRPC Schema",
        "schema": {
          "$ref": "https://raw.githubusercontent.com/open-rpc/meta-schema/master/schema.json"
        }
      }
    }
  ]
}
```

# Examples

Example OpenRPC documents can be found in the [OpenRPC Examples Repository](https://github.com/open-rpc/examples). There SHOULD be an example that uses every concept of the spec. These examples are to be used as the basis of testing for all the Official OpenRPC tooling.

# Meta JSON Schema

Validating an OpenRPC document can be accomplished using the OpenRPC MetaSchema. The OpenRPC MetaSchema is based on the [Draft 07 JSON Schema](https://json-schema.org/draft-07/schema), and may be used as a JSON meta-schema for various tooling use. Each field in the Specification MUST be included in the OpenRPC MetaSchema, including all constraints that are possible to model with [Draft 07 JSON Schema](https://json-schema.org/draft-07/schema).

# <span id="jsonschema-object">Schema Object</span>

The Schema Object allows the definition of input and output data types.
The Schema Objects MUST follow the specifications outline in the [JSON Schema Specification 7](https://json-schema.org/draft-07/json-schema-release-notes.html)
Alternatively, any time a Schema Object can be used, a [Reference Object](#reference-object) can be used in its place. This allows referencing definitions instead of defining them inline.

This object MAY be extended with [Specification Extensions](#specification-extensions).

# OpenRPC Object

This is the root object of the [OpenRPC document](#openrpc-document). The contents of this object represent a whole [OpenRPC document](#openrpc-document). How this object is constructed or stored is outside the scope of the OpenRPC Specification.
