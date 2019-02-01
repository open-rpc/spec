# Project Releasing

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [BCP 14](https://tools.ietf.org/html/bcp14) [RFC2119](https://tools.ietf.org/html/rfc2119) [RFC8174](https://tools.ietf.org/html/rfc8174) when, and only when, they appear in all capitals, as shown here.

This document is licensed under [The Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0.html).

When using the name 'version' we mean the versioning scheme described in [VERSIONING.md](VERSIONING.md)

## Introduction

This document is to describe the release pipeline, which is taking the result of the artifacts created according to [BUILDING.md](BUILDING.md) and publish a release to the various release targets for the project.

We propose:
 - a set of release targets that are allowable
 - a pipeline for handling the release folder's artifacts

It is NOT the purpose of this document to describe how a project might create a build, NOR is it describing a strcture in which projects MUST write build artifacts to. It is describing the structure of the releases themselves.

## Release Targets
1. Github
2. (tentative) docker

## Release Pipeline
The only parameter to the release pipeline is the new semver to use. We will refer to it as newVer.
Starting from a clean branch:

### Create a build from current branch
Process is outlined in [the BUILDING spec](building.md)
in summary, we will simply:
1. Clean the build directory
2. run: `docker-compose up -f ./docker-compose.build.yml`

### Sign the releases.
 - MUST be a pgp signature
 - MUST be the same pgp key as is registered with Github
 - MUST be a detached signature
 - All files in the build folder MUST have an associated signature file

### Generate Changelog
For our projects we will be using [conventional changelog](https://github.com/conventional-changelog/conventional-changelog).

1. Generate the changelog. EX: `conventional-changelog -p angular -i CHANGELOG.md -s -r 0`
2. git add the changelog diff: `git add CHANGELOG.md`

### Bump the version of the project
This is project specific.

use the convention outlined by [VERSIONING.md](VERSIONING.md):
 - `bin/bump-version.sh {newVer}`

### Commit the bump + changelog update
generate a commit with the changes.

### Push changelog & version bump
simple as `git push`.

### Run Release Targets
For each of the desired release targets, prepare and push the release.

#### Github Release
Using [Github release tool](https://github.com/c4milo/github-release), push a release with the following fields:


| Field name       | Content                                                        |
| ---------------- | -------------------------------------------------------------- |
| tag version      | {newVer}                                                       |
| title            | same as tag                                                    |
| description      | {changelog for specific version}                               |
| release binaries | for each platform: `{project-name}-{platform}-{version}.{ext}` |
