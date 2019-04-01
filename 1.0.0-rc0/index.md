<p align="center">
  <img src="https://github.com/open-rpc/design/blob/master/png/open-rpc-logo-320x320.png?raw=true" />

</p>
<p align="center">
<a href="https://etclabs.org">Sponsored by <img alt="Ethereum Classic Lab" src="https://github.com/open-rpc/design/blob/master/png/etc-labs-logo-32x32.png" /> Ethereum Classic Labs</a>.
</p>

# OpenRPC Specification


#### Version 1.0.0

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [BCP 14](https://tools.ietf.org/html/bcp14) [RFC2119](https://tools.ietf.org/html/rfc2119) [RFC8174](https://tools.ietf.org/html/rfc8174) when, and only when, they appear in all capitals, as shown here.

In the following description, if a field is not explicitly **REQUIRED** or described with a MUST or SHALL, it can be considered OPTIONAL.

This document is licensed under [The Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0.html).

### Table of Contents
<!-- TOC depthFrom:1 depthTo:3 withLinks:1 updateOnSave:1 orderedList:0 -->

- [Introduction](#introduction)
- [Contributing](#contributing)
- [Definitions](#definitions)
	- [OpenRPC Document](#openrpc-document)
- [Specification](#specification)
	- [Versions](#versions)
	- [Format](#format)
	- [Document Structure](#document-structure)
	- [Data Types](#data-types)
	- [Rich Text Formatting](#rich-text-formatting)
	- [OpenRPC Schema Object](#openrpc-schema-object)
		- [Info Object](#info-object)
		    - [Contact Object](#contact-object)
		    - [License Object](#license-object)
		- [Server Object](#serverObject)
		    - [Server Variable Object](#server-variable-object)
		- [Method Object](#method-object)
		    - [Content Descriptor Object](#content-descriptor-object)
		        - [Schema Object](#schema-object)
            	- [Example Object](#example-object)
		    - [Link Object](#link-object)
            	- [Runtime Expression](#runtime-expression)
		    - [Error Object](#errorObject)
		- [Components Object](#components-object)
		- [Tag Object](#tag-object)
		- [External Documentation Object](#externalDocumentationObject)
		- [Reference Object](#reference-object)
	- [Specification Extensions](#specification-extensions)


<!-- /TOC -->

## Introduction

The OpenRPC Specification defines a standard, programming language-agnostic interface description for [JSON-RPC 2.0 APIs](https://www.jsonrpc.org/specification), which allows both humans and computers to discover and understand the capabilities of a service without requiring access to source code, additional documentation, or inspection of network traffic. When properly defined via OpenRPC, a consumer can understand and interact with the remote service with a minimal amount of implementation logic. Similar to what interface descriptions have done for lower-level programming, the OpenRPC Specification removes guesswork in calling a service.

Use cases for machine-readable JSON-RPC API definition documents include, but are not limited to:
 - interactive documentation
 - code generation for documentation
 - clients
 - servers
 - automation of test cases.

OpenRPC documents describe a JSON-RPC APIs services and are represented in JSON format. These documents may either be produced and served statically or be generated dynamically from an application.

The OpenRPC Specification does not require rewriting existing JSON-RPC APIs. It does not require binding any software to a service — the service being described may not even be owned by the creator of its description. It does, however, require the capabilities of the service be described in the structure of the OpenRPC Specification. Not all services can be described by OpenRPC — this specification is not intended to cover REST APIs - It is exclusively for APIs which adhere to the JSON-RPC 2.0 spec. The OpenRPC Specification does not mandate a specific development process such as design-first or code-first. It does facilitate either technique by establishing clear interactions with a JSON-RPC API.

## Contributing

How to contribute, build and release are outlined in [CONTRIBUTING.md](CONTRIBUTING.md), [BUILDING.md](BUILDING.md) and [RELEASING.md](RELEASING.md) respectively. Commits in this repository follow the [CONVENTIONAL_COMMITS.md](CONVENTIONAL_COMMITS.md) specification.

## Definitions
##### OpenRPC Document
A document (or set of documents) that defines or describes an API. An OpenRPC definition uses and conforms to the OpenRPC Specification.

## Specification
### Versions

The OpenRPC Specification is versioned using [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html) (semver) and follows the semver specification.

The `major`.`minor` portion of the semver (for example `1.0.x`) SHALL designate the OpenRPC feature set. Typically, *`.patch`* versions address errors in this document, not the feature set. Tooling which supports OpenRPC 1.0.0 SHOULD be compatible with all OpenRPC 1.0.\* versions. The patch version SHOULD NOT be considered by tooling, making no distinction between `1.0.0` and `1.0.1` for example.

Subsequent minor version releases of the OpenRPC Specification (incrementing the `minor` version number) SHOULD NOT interfere with tooling developed to a lower minor version and same major version.  Thus a hypothetical `1.1.0` specification SHOULD be usable with tooling designed for `1.0.0`.

An OpenRPC document compatible with OpenRPC 1.0.0 contains a required [`openrpc`](#openrpc-version) field which designates the semantic version of the OpenRPC that it uses.

### Format

An OpenRPC document that conforms to the OpenRPC Specification is itself a JSON object, which must be represented in JSON format.

All field names in the specification are **case sensitive**.
This includes all fields that are used as keys in a map, except where explicitly noted that keys are **case insensitive**.

The schema exposes two types of fields: Fixed fields, which have a declared name, and Patterned fields, which declare a regex pattern for the field name.

Patterned fields MUST have unique names within the containing object.

Due to the nature of JSON-RPC APIs using JSON formats, strictly use JSON only [as described here](https://tools.ietf.org/html/rfc7159).

### Document Structure

An OpenRPC document MAY be made up of a single document or be divided into multiple, connected parts at the discretion of the user. In the latter case, `$ref` fields MUST be used in the specification to reference those parts as follows from the [JSON Schema](https://json-schema.org/latest/json-schema-core.html#rfc.section.8.3) definitions.

It is RECOMMENDED that the root OpenRPC document be named: `openrpc.json`.

### Data Types

The Data types MUST be in the set defined by the [JSON Schema Specification 7](https://json-schema.org/latest/json-schema-core.html)

### Rich Text Formatting
Throughout the specification `description` fields are noted as supporting Github markdown formatting.
Where OpenRPC tooling renders rich text it MUST support, at a minimum, markdown syntax as described by [GitHub Flavored Markdown](https://github.github.com/gfm/). Tooling MAY choose to ignore some GitHub Flavored Markdown features to address security concerns.

### OpenRPC Schema Object
This is the root document object of the [OpenRPC document](#openrpcDocument).

Field Name | Type | Description
---|:---:|---
<a name="openrpc-version"></a>openrpc | `string` | **REQUIRED**. This string MUST be the [semantic version number](https://semver.org/spec/v2.0.0.html) of the [OpenRPC Specification version](#versions) that the OpenRPC document uses. The `openrpc` field SHOULD be used by tooling specifications and clients to interpret the OpenRPC document. This is *not* related to the API [`info.version`](#infoVersion) string.
<a name="openrpc-info"></a>info | [Info Object](#info-object) | **REQUIRED**. Provides metadata about the API. The metadata MAY be used by tooling as required.
<a name="openrpc-servers"></a>servers | [[Server Object](#server-object)] | An array of Server Objects, which provide connectivity information to a target server. If the `servers` property is not provided, or is an empty array, the default value would be a [Server Object](#server-object) with a [url](#server-url) value of `/`.
<a name="openrpc-methods"></a>methods | [[Method Object](#method-object) \| [Reference Object](#reference-object)] | **REQUIRED**. The available methods for the API. While it is required, the array may be empty (to handle security filtering, for example).
<a name="openrpc-components"></a>components | [Components Object](#components-object) | An element to hold various schemas for the specification.
<a name="openrpc-tags"></a>tags | [[Tag Object](#tag-object)] | A list of tags used by the specification with additional metadata. The order of the tags can be used to reflect on their order by the parsing tools. Not all tags that are used by the [Method Object](#method-object) must be declared. The tags that are not declared MAY be organized randomly or based on the tools' logic. Each tag name in the list MUST be unique.
<a name="openrpcExternalDocs"></a>externalDocs | [External Documentation Object](#external-documentation-object) | Additional external documentation.

This object MAY be extended with [Specification Extensions](#specification-extensions).

#### Info Object
The object provides metadata about the API.
The metadata MAY be used by the clients if needed, and MAY be presented in editing or documentation generation tools for convenience.

Field Name | Type | Description
---|:---:|---
<a name="info-title"></a>title | `string` | **REQUIRED**. The title of the application.
<a name="info-description"></a>description | `string` | A short description of the application. [GitHub Flavored Markdown](https://github.github.com/gfm/) MAY be used for rich text representation.
<a name="info-termsofservice"></a>termsOfService | `string` | A URL to the Terms of Service for the API. MUST be in the format of a URL.
<a name="info-contact"></a>contact | [Contact Object](#contact-object) | The contact information for the exposed API.
<a name="info-license"></a>license | [License Object](#license-object) | The license information for the exposed API.
<a name="info-version"></a>version | `string` | **REQUIRED**. The version of the OpenRPC document (which is distinct from the [OpenRPC Specification version](#openrpc-version) or the API implementation version).


This object MAY be extended with [Specification Extensions](#specification-extensions).

Info Object Example:

```json
{
  "title": "Sample Pet Store App",
  "description": "This is a sample server for a pet store.",
  "termsOfService": "http://example.com/terms/",
  "contact": {
    "name": "API Support",
    "url": "http://www.example.com/support",
    "email": "support@example.com"
  },
  "license": {
    "name": "Apache 2.0",
    "url": "https://www.apache.org/licenses/LICENSE-2.0.html"
  },
  "version": "1.0.1"
}
```

##### Contact Object

Contact information for the exposed API.

Field Name | Type | Description
---|:---:|---
<a name="contact-name"></a>name | `string` | The identifying name of the contact person/organization.
<a name="contact-url"></a>url | `string` | The URL pointing to the contact information. MUST be in the format of a URL.
<a name="contact-email"></a>email | `string` | The email address of the contact person/organization. MUST be in the format of an email address.

This object MAY be extended with [Specification Extensions](#specification-extensions).

Contact Object Example:
```json
{
  "name": "API Support",
  "url": "http://www.example.com/support",
  "email": "support@example.com"
}
```

##### License Object

License information for the exposed API.

Field Name | Type | Description
---|:---:|---
<a name="license-name"></a>name | `string` | **REQUIRED**. The license name used for the API.
<a name="license-url"></a>url | `string` | A URL to the license used for the API. MUST be in the format of a URL.

This object MAY be extended with [Specification Extensions](#specification-extensions).

License Object Example:
```json
{
  "name": "Apache 2.0",
  "url": "https://www.apache.org/licenses/LICENSE-2.0.html"
}
```


#### Server Object

An object representing a Server.

Field Name | Type | Description
---|:---:|---
<a name="server-name"></a>name | `string` | **REQUIRED**. A name to be used as the cannonical name for the server.
<a name="server-url"></a>url | `string` | **REQUIRED**. A URL to the target host.  This URL supports Server Variables and MAY be relative, to indicate that the host location is relative to the location where the OpenRPC document is being served. Variable substitutions will be made when a variable is named in `{`brackets`}`.
<a name="server-description"></a>description | `string` | An optional string describing the host designated by the URL. [CGitHub Flavored Markdown syntax](https://github.github.com/gfm/) MAY be used for rich text representation.
<a name="server-variables"></a>variables | Map[`string`, [Server Variable Object](#server-variable-object)] | A map between a variable name and its value.  The value is used for substitution in the server's URL template.

This object MAY be extended with [Specification Extensions](#specification-extensions).

Server Object Example:

A single server would be described as:

```json
{
  "name": "dev",
  "url": "https://development.gigantic-server.com/v1",
  "description": "Development server"
}
```

The following shows how multiple servers can be described, for example, at the OpenRPC Object's [`servers`](#openrpc-servers):

```json
{
  "servers": [
    {
      "name": "dev",
      "url": "https://development.gigantic-server.com/v1",
      "description": "Development server"
    },
    {
      "name": "staging",
      "url": "https://staging.gigantic-server.com/v1",
      "description": "Staging server"
    },
    {
      "name": "production",
      "url": "https://api.gigantic-server.com/v1",
      "description": "Production server"
    }
  ]
}
```

The following shows how variables can be used for a server configuration:

```json
{
  "servers": [
    {
      "name": "production",
      "url": "https://{username}.gigantic-server.com:{port}/{basePath}",
      "description": "The production API server",
      "variables": {
        "username": {
          "default": "demo",
          "description": "this value is assigned by the service provider, in this example `gigantic-server.com`"
        },
        "port": {
          "enum": [
            "8443",
            "443"
          ],
          "default": "8443"
        },
        "basePath": {
          "default": "v2"
        }
      }
    }
  ]
}
```

##### Server Variable Object

An object representing a Server Variable for server URL template substitution.

Field Name | Type | Description
---|:---:|---
<a name="server-variable-enum"></a>enum | [`string`] | An enumeration of string values to be used if the substitution options are from a limited set.
<a name="server-variable-default"></a>default | `string` |  **REQUIRED**. The default value to use for substitution, which SHALL be sent if an alternate value is _not_ supplied. Note this behavior is different than the [Schema Object's](#schema-object) treatment of default values, because in those cases parameter values are optional.
<a name="server-variable-description"></a>description | `string` | An optional description for the server variable. [GitHub Flavored Markdown syntax](https://github.github.com/gfm/) MAY be used for rich text representation.

This object MAY be extended with [Specification Extensions](#specification-extensions).

#### Method Object

Describes the interface for the given method name. The method name is used as the `method` field of the JSON-RPC body. It therefor MUST be unique.

Field Name | Type | Description
---|:---:|---
<a name="method-name"></a>name | [`string`] | The cannonical name for the method. The name MUST be unique within the methods array.
<a name="method-tags"></a>tags | [`string`] | A list of tags for API documentation control. Tags can be used for logical grouping of methods by resources or any other qualifier.
<a name="method-summary"></a>summary | `string` | A short summary of what the method does.
<a name="method-description"></a>description | `string` | A verbose explanation of the method behavior. [GitHub Flavored Markdown syntax](https://github.github.com/gfm/) MAY be used for rich text representation.
<a name="method-externalDocs"></a>externalDocs | [External Documentation Object](#external-documentation-object) | Additional external documentation for this method.
<a name="method-parameters"></a>params | [[Content Descriptor](#content-descriptor-object) \| [Reference Object](#reference-object)] | A list of parameters that are applicable for this method. The list MUST NOT include duplicated parameters and therefore require [name](#content-descriptor-name) to be unique. The list can use the [Reference Object](#reference-object) to link to parameters that are defined by the [Content Descriptor Object](#content-descriptor-object).
<a name="method-result"></a>result | [Content Descriptor](#content-descriptor-object) \| [Reference Object](#reference-object) | **REQUIRED**. The description of the result returned by the method. It MUST be a Content Descriptor.
<a name="method-deprecated"></a>deprecated | `boolean` | Declares this method to be deprecated. Consumers SHOULD refrain from usage of the declared method. Default value is `false`.
<a name="method-servers"></a>servers | [[Server Object](#server-object)] | An alternative `servers` array to service this method. If an alternative `servers` array is specified at the Root level, it will be overridden by this value.
<a name="method-errors"></a>errors | [[Error Object](#error-object) \| [Reference Object](#reference-object)] | A list of custom application defined errors that MAY be returned. The Errors MUST have unique error codes.
<a name="method-links"></a>links | [[Link Object](#link-object) \| [Reference Object](#reference-object)] | A list of possible links from this method call.
<a name="method-param-structure"></a>paramStructure | `"by-name"` | `"by-position"` | Format the server expects the params. Defaults to `"by-positon"`.

This object MAY be extended with [Specification Extensions](#specification-extensions).

Method Object Example:
```json
{
  "tags": [
    "pet"
  ],
  "name": "update_pet",
  "paramStructure": "by-name",
  "summary": "Updates a pet in the store with form data",
  "description": "#Big Ol long Doc Filled WIth Markdown!",
  "params": [
    {
      "name": "petId",
      "description": "ID of pet that needs to be updated",
      "required": true,
      "schema": {
        "type": "string"
      }
    },
    {
      "name": "name",
      "description": "Updated name of the pet",
      "schema": {
        "type": "string"
      }
    },
    {
      "name": "status",
      "description": "Updated status of the pet",
      "required": "true",
      "schema": {
        "type": "string",
      }
    }
  ],
  "result": {
    "description": "Pet updated.",
    "schema": {
      "$ref": "#/components/schemas/Pet"
    }
  }
}
```

##### Content Descriptor Object
Content Descriptors are objects that do just as they suggest - describe content. They are reusable ways of describing either parameters or result. They MUST have a schema.

Field Name | Type | Description
---|:---:|---
<a name="content-descriptor-name"></a>name | `string` | name of the content that is being described.
<a name="content-descriptor-Summary"></a>summary | `string` | A short summary of what the method does.
<a name="content-descriptor-description"></a>description | `string` | A verbose explanation of the method behavior. [GitHub Flavored Markdown syntax](https://github.github.com/gfm/) MAY be used for rich text representation.
<a name="content-descriptor-required"></a>required | `boolean` | Determines if the content is a required field.
<a name="content-descriptor-schema"></a>schema | [Schema Object](#schema-object) | Schema that describes the content.
<a name="content-descriptor-examples"></a>examples | [[Example Object](#example-object)] | Examples of the parameter. The examples MUST match the specified schema. If referencing a `schema` which contains (an) example(s), the `examples` value SHALL _override_ the examples provided by the schema. To represent examples of media types that cannot naturally be represented in JSON, a string value can contain the example with escaping where necessary.
<a name="content-descriptor-deprecated"></a>deprecated | `boolean` | Specifies that the content is deprecated and SHOULD be transitioned out of usage. Default value is `false`.

This object MAY be extended with [Specification Extensions](#specification-extensions).

When `examples` is provided in conjunction with the `schema` object, the examples MUST follow the prescribed serialization strategy for the parameter.

Content Descriptor Object Examples:

1. A parameter with an array of 64 bit integer numbers:
```json
{
  "name": "token",
  "description": "token to be passed as a header",
  "required": true,
  "schema": {
    "type": "array",
    "items": {
      "type": "integer",
      "format": "int64"
    }
  }
}
```

2. A parameter of a string value:
```json
{
  "name": "username",
  "description": "username to fetch",
  "required": true,
  "schema": {
    "type": "string"
  }
}
```

3. An optional parameter of an array of string values
```json
{
  "name": "id",
  "description": "ID of the object to fetch",
  "required": false,
  "schema": {
    "type": "array",
    "items": {
      "type": "string"
    }
  }
}
```

4. A parameter, allowing undefined parameters of a specific type:
```json
{
  "name": "freeForm",
  "schema": {
    "type": "object",
    "additionalProperties": {
      "type": "integer"
    }
  }
}
```

5. A complex parameter

```json
{
  "name": "coordinates",
  "schema": {
    "type": "object",
    "required": [
      "lat",
      "long"
    ],
    "properties": {
      "lat": {
        "type": "number"
      },
      "long": {
        "type": "number"
      }
    }
  }
}
```


###### Schema Object

The Schema Object allows the definition of input and output data types.
The Schema Objects MUST follow the specifications outline in the [JSON Schema Specification 7](https://json-schema.org/draft-07/json-schema-release-notes.html)
Alternatively, any time a Schema Object can be used, a [Reference Object](#reference-object) can be used in its place. This allows referencing definitions instead of defining them inline.

This object MAY be extended with [Specification Extensions](#specification-extensions).

Schema Object Examples:

1. Primitive Sample

```json
{
  "type": "string",
  "format": "email"
}
```

2. Simple Model

```json
{
  "type": "object",
  "required": [
    "name"
  ],
  "properties": {
    "name": {
      "type": "string"
    },
    "address": {
      "$ref": "#/components/schemas/Address"
    },
    "age": {
      "type": "integer",
      "format": "int32",
      "minimum": 0
    }
  }
}
```

3. Model with Map/Dictionary Properties

For a simple string to string mapping:

```json
{
  "type": "object",
  "additionalProperties": {
    "type": "string"
  }
}
```

For a string to model mapping:

```json
{
  "type": "object",
  "additionalProperties": {
    "$ref": "#/components/schemas/ComplexModel"
  }
}
```

4. Model with Examples

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "integer",
      "format": "int64"
    },
    "name": {
      "type": "string"
    }
  },
  "required": [
    "name"
  ],
  "examples": [
    {
      "name": "Puma",
      "id": 1
    }
  ]
}
```

5. Models with Composition

```json
{
  "components": {
    "schemas": {
      "DogModel": {
        "type": "object",
        "required": [
          "breedName",
        ],
        "properties": {
          "breedName": {
            "type": "string"
          }
        }
      },
      "ShepherdDogModel": {
        "allOf": [
          {
            "$ref": "#/components/schemas/DogModel"
          },
          {
            "type": "object",
            "properties": {
              "hairLength": {
                "type": "string",
		"enum": ["short", "long"]
              }
            }
          }
        ]
      }
    }
  }
}
```


###### Example Object

Field Name | Type | Description
---|:---:|---
<a name="example-name"></a>name | `string` | cannonical name of the example.
<a name="example-summary"></a>summary | `string` | Short description for the example.
<a name="example-description"></a>description | `string` | Long description for the example. [GitHub Flavored Markdown syntax](https://github.github.com/gfm/) MAY be used for rich text representation.
<a name="example-value"></a>value | Any | Embedded literal example. The `value` field and `externalValue` field are mutually exclusive. To represent examples of media types that cannot naturally represented in JSON, use a string value to contain the example, escaping where necessary.
<a name="example-externalValue"></a>externalValue | `string` | A URL that points to the literal example. This provides the capability to reference examples that cannot easily be included in JSON documents.  The `value` field and `externalValue` field are mutually exclusive.

This object MAY be extended with [Specification Extensions](#specification-extensions).

In all cases, the example value is expected to be compatible with the type schema
of its associated value.  Tooling implementations MAY choose to
validate compatibility automatically, and reject the example value(s) if incompatible.

Example Object Examples:

```json
{
  "contentDescriptors": {
    "nameExample": {
      "name": "exampleString",
      "type": "string",
      "examples": [
        { "$ref": "http://example.org/petapi-examples/openrpc.json#/components/examples/name-example" },
        {
          "name": "Chinese",
          "summary": "using non-english characters",
          "description": "an example of how the rpc api can handle non english characters",
          "value": "你好世界"
        }
      ]
    }
  }
}
```

##### Link Object

The `Link object` represents a possible design-time link for a result.
The presence of a link does not guarantee the caller's ability to successfully invoke it, rather it provides a known relationship and traversal mechanism between results and other methods.

Unlike _dynamic_ links (i.e. links provided **in** the result payload), the OpenRPC linking mechanism does not require link information in the runtime result.

For computing links, and providing instructions to execute them, a [runtime expression](#runtimeExpression) is used for accessing values in an method and using them as parameters while invoking the linked method.

Field Name  |  Type  | Description
---|:---:|---
<a name="link-method"></a>method | `string` | The name of an _existing_, resolvable OpenRPC method, as defined with a unique `method`. This field MUST resolve to a unique [Method Object](#method-object). As opposed to Open Api, Relative `method` values  ARE NOT permitted.
<a name="link-parameters"></a>params   | Map[`string`, Any \| [{expression}](#runtime-expression)] | A map representing parameters to pass to a method as specified with `method`. The key is the parameter name to be used, whereas the value can be a constant or an expression to be evaluated and passed to the linked method.
<a name="link-description"></a>description  | `string` | A description of the link. [GitHub Flavored Markdown syntax](https://github.github.com/gfm/) MAY be used for rich text representation.
<a name="link-server"></a>server       | [Server Object](#server-object) | A server object to be used by the target method.

This object MAY be extended with [Specification Extensions](#specification-extensions).

A linked method must be identified directly, and must exist in the list of methods defined by the [Methods Object](#method-object).

Examples:

Computing a link from a request operation where the `$params.id` is used to pass a request parameter to the linked method.

```json
{
  "methods": [
    {
      "name": "get_user",
      "params": [
        {
          "name": "id",
          "required": true,
          "description": "the user identifier, as userId",
          "schema": {
            "type": "string"
          }
        }
      ],
      "result": {
        "description": "the user being returned",
        "schema": {
          "type": "object",
          "properties": {
            "uuid": {
              "type": "string",
              "format": "uuid"
            }
          }
        }
      },
      "links": [
        {
          "method": "get_user_address",
          "params": {
            "userId": "$params.id"
          }
        }
      ]
    },
    {
      "name": "get_user_address",
      "params": [
        {
          "name": "userId",
          "required": true,
          "description": "the user identifier, as userId",
          "schema": {
            "type": "string"
          }
        }
      ],
      "result": {
        "description": "the user's address"
      }
    }
  ]
}
```

When a runtime expression fails to evaluate, no parameter value is passed to the target method.

Values from the result can be used to drive a linked method.

```json
{
  "links": [
    {
      "method": "get_user_address",
      "params": {
        "userId": "$result.uuid"
      }
    }
  ]
}
```

Clients follow all links at their discretion.
Neither permissions, nor the capability to make a successful call to that link, is guaranteed
solely by the existence of a relationship.

###### Runtime Expressions

Runtime expressions allow defining values based on information that will only be available within the HTTP message in an actual API call.
This mechanism is used by [Link Objects](#link-object).

The runtime expression is based on the runtime expression defined by the following [ABNF](https://tools.ietf.org/html/rfc5234) syntax.
Since JSON-RPC does not make extensive use of status codes, query params or paths, many of the fields do not apply and have been omited.

```
      expression = ( "$params." source | "$result." source )
      fragment = a JSON Pointer [RFC 6901](https://tools.ietf.org/html/rfc6901)
      name = *( char )
      char = as per RFC [7159](https://tools.ietf.org/html/rfc7159#section-7)
      token = as per RFC [7230](https://tools.ietf.org/html/rfc7230#section-3.2.6)
```

The `name` identifier is case-sensitive, whereas `token` is not.

The table below provides examples of runtime expressions and examples of their use in a value:

Examples:

Source Location | example expression  | notes
---|:---|:---|
Parameters      | `$params.id`        | Parameters MUST be declared in the `params` section of the parent method or they cannot be evaluated.
Deep Parameters | `$params.user.uuid`   | In methods which accept nested object payloads, `.` may be used to denote traversal of an object.
Result         | `$result.uuid`       |  In methods which return payloads, references may be made to portions of result or the entire result.

Runtime expressions preserve the type of the referenced value.
Expressions can be embedded into string values by surrounding the expression with `{}` curly braces.

##### Error Object
Defines an application level error.

Field Name | Type | Description
---|:---:|---
<a name="error-code"></a>code | [Application Defined Error Code](https://www.jsonrpc.org/specification#response_object) | A Number that indicates the error type that occurred. This MUST be an integer. The error codes from and including -32768 to -32000 are reserved for pre-defined errors. These pre-defined errors SHOULD be assumed to be returned from any JSON-RPC api.
<a name="error-message"></a>message | `string` | A String providing a short description of the error. The message SHOULD be limited to a concise single sentence.
<a name="error-data"></a>data | `any` | A Primitive or Structured value that contains additional information about the error. This may be omitted. The value of this member is defined by the Server (e.g. detailed error information, nested errors etc.).

#### Components Object

Holds a set of reusable objects for different aspects of the OpenRPC.
All objects defined within the components object will have no effect on the API unless they are explicitly referenced from properties outside the components object.

Field Name | Type | Description
---|:---|---
<a name="components-content-descriptors"></a>contentDescriptors | Map[`string`, [Content Descriptor Object](#content-descriptor-object)] | An object to hold reusable [Content Descriptor Objects](#content-descriptor-object).
<a name="components-schemas"></a>schemas | Map[`string`, [Schema Object](#schema-object)] | An object to hold reusable [Schema Objects](#schema-object).
<a name="components-examples"></a>examples | Map[`string`, [Example Object](#example-object) \| [Reference Object](#reference-object)] | An object to hold reusable [Example Objects](#example-object).
<a name="components-links"></a> links | Map[`string`, [Link Object](#link-object) \| [Reference Object](#reference-object)] | An object to hold reusable [Link Objects](#link-object).
<a name="components-errors"></a>errors | Map[`string`, [Error Object](#error-object)] | An object to hold reusable [Error Objects](#error-object).

This object MAY be extended with [Specification Extensions](#specification-extensions).

All the fixed fields declared above are objects that MUST use keys that match the regular expression: `^[a-zA-Z0-9\.\-_]+$`.

Field Name Examples:

```
User
User_1
User_Name
user-name
my.org.User
```

Components Object Example:

```json
"components": {
  "schemas": {
    "GeneralModel": {
      "type": "object",
      "properties": {
        "code": {
          "type": "integer",
          "format": "int32"
        },
        "message": {
          "type": "string"
        }
      }
    },
    "Category": {
      "type": "object",
      "properties": {
        "id": {
          "type": "integer",
          "format": "int64"
        },
        "name": {
          "type": "string"
        }
      }
    },
    "Tag": {
      "type": "object",
      "properties": {
        "id": {
          "type": "integer",
          "format": "int64"
        },
        "name": {
          "type": "string"
        }
      }
    }
  },
  "contentDescriptors": {
    "skipParam": {
      "name": "skip",
      "description": "number of items to skip",
      "required": true,
      "schema": {
        "type": "integer",
        "format": "int32"
      }
    },
    "limitParam": {
      "name": "limit",
      "description": "max records to return",
      "required": true,
      "schema" : {
        "type": "integer",
        "format": "int32"
      }
    }
  },
  "errors": {
    "CustomNotFound": {
      "code": "1",
      "message": "super duper not found doe",
      "data": "absolute pandemonium"
    }
  }
}
```

#### Tag Object

Adds metadata to a single tag that is used by the [Method Object](#method-object).
It is not mandatory to have a Tag Object per tag defined in the Method Object instances.

Field Name | Type | Description
---|:---:|---
<a name="tag-name"></a>name | `string` | **REQUIRED**. The name of the tag.
<a name="tag-description"></a>description | `string` | A short description for the tag. [GitHub Flavored Markdown syntax](https://github.github.com/gfm/) MAY be used for rich text representation.
<a name="tag-externalDocs"></a>externalDocs | [External Documentation Object](#external-documentation-object) | Additional external documentation for this tag.

This object MAY be extended with [Specification Extensions](#specification-extensions).

Tag Object Example:

```json
{
	"name": "pet",
	"description": "Pets operations"
}
```

#### External Documentation Object

Allows referencing an external resource for extended documentation.

Field Name | Type | Description
---|:---:|---
<a name="external-doc-description"></a>description | `string` | A short description of the target documentation. [GitHub Flavored Markdown syntax](https://github.github.com/gfm/) MAY be used for rich text representation.
<a name="external-doc-url"></a>url | `string` | **REQUIRED**. The URL for the target documentation. Value MUST be in the format of a URL.

This object MAY be extended with [Specification Extensions](#specification-extensions).

External Documentation Object Example:

```json
{
  "description": "Find more info here",
  "url": "https://example.com"
}
```

#### Reference Object

A simple object to allow referencing other components in the specification, internally and externally.

The Reference Object is defined by [JSON Schema](https://json-schema.org/latest/json-schema-core.html#rfc.section.8.3) and follows the same structure, behavior and rules.

Field Name | Type | Description
---|:---:|---
<a name="reference-ref"></a>$ref | `string` | **REQUIRED**. The reference string.

This object cannot be extended with additional properties and any properties added SHALL be ignored.

Reference Object Example:

```json
{
	"$ref": "#/components/schemas/Pet"
}
```

Relative Schema Document Example:
```json
{
  "$ref": "Pet.json"
}
```

Relative Documents With Embedded Schema Example:
```json
{
  "$ref": "definitions.json#/Pet"
}
```

### Specification Extensions

While the OpenRPC Specification tries to accommodate most use cases, additional data can be added to extend the specification at certain points.

The extensions properties are implemented as patterned fields that are always prefixed by `"x-"`.

Field Pattern | Type | Description
---|:---:|---
<a name="info-extensions"></a>^x- | Any | Allows extensions to the OpenRPC Schema. The field name MUST begin with `x-`, for example, `x-internal-id`. The value can be `null`, a primitive, an array or an object. Can have any valid JSON format value.

The extensions may or may not be supported by the available tooling, but those may be extended as well to add requested support (if tools are internal or open-sourced).
