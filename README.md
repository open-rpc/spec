# The OpenRPC Specification Repository

<p align="center">
  <img alt="open-rpc logo" src="https://github.com/open-rpc/design/blob/master/png/open-rpc-logo-320x320.png?raw=true" />
</p>

<p align="center">
  Join us on <a href="https://discord.gg/gREUKuF">Discord</a>!
</p>

## Purpose of this Repository

This is a repository that contains the OpenRPC specification, and the tooling to build, maintain, and release the specification.

## Latest OpenRPC Specification

The latest version of the specification may be found [here](https://spec.open-rpc.org/).

## Previous Versions of the Specification

All versions of the specification can be found on [the Github releases page](https://github.com/open-rpc/spec/releases).

You may also access specific versions of the spec by appending the version to the spec url as follows:

`https://spec.open-rpc.org/1.0.0`

## _Announcement Recent Change_

The OpenRPC specification is now **packaged and deployed** as `@open-rpc/spec`, and it includes **versioned historical schemas**.
This allows downstream tooling and SDKs to pull specific schema versions directly from the published package.

Examples:

- `@open-rpc/spec/1_3/schema.json`
- `@open-rpc/spec/1_4/schema.json`

## Regex Change (starting 1.4)

Starting with the `1.4.x` schema line, the `openrpc` constraint moves from explicit patch-level enumeration to a regex-based version-line constraint.
This means `1.4.x` is validated as a compatibility line instead of requiring each patch version to be listed.

## ENUM Change

Historically, schema compatibility across versions was not always explicit.
To clarify behavior boundaries, version ENUMs are now treated as strict compatibility declarations: a spec version appears only when that schema behavior set explicitly supports it.

These changes are not intended to break existing valid documents, but they make version/behavior differences explicit and machine-checkable for tooling.

## Contributing

How to contribute, build and release are outlined in [CONTRIBUTING.md](CONTRIBUTING.md), [BUILDING.md](BUILDING.md) and [RELEASING.md](RELEASING.md) respectively. Commits in this repository follow the [CONVENTIONAL_COMMITS.md](CONVENTIONAL_COMMITS.md) specification.

## Contact

Need help or have a question? Join us on [Discord](https://discord.gg/gREUKuF)!
