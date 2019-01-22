# Jade Project Building

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [BCP 14](https://tools.ietf.org/html/bcp14) [RFC2119](https://tools.ietf.org/html/rfc2119) [RFC8174](https://tools.ietf.org/html/rfc8174) when, and only when, they appear in all capitals, as shown here.

This document is licensed under [The Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0.html).

When using the name 'version' we mean the versioning scheme described in [VERSIONING.md](VERSIONING.md)

## Introduction

This document is to describe the functionality a jade project MUST provide in terms of creating build artifacts. It also describes the structure in which jade project's MUST write build artifacts in.

We propose:
 - a folder name convention for build artifacts
 - a folder structure for the above-mentioned build artifacts folder
 - a list of platforms we will target
 - Using docker-compose with a service for each build target
 - a build pipeline given the above pretext

The purpose of having a uniform way of producing a build is that we may ALL produce builds for any of the projects, making the onramp for new developers less steep, while still maintaining an exceptionally high level of quality.

Further, the projects should adhere to the principles of 'architecture as code' - and should require a very minimal set of dependencies in order to contribute. That said, we have chose to center around docker for creating builds. Windows builds may be created using `wine`. If Wine is not an option, the standard may be broken to accomodate such cases.

It is the responsibilty of the build tooling to write artifacts to the appropriate location as outlined in this specification.

## Build Folder Name
The cannonical folder for builds SHALL be named `build` and be located at the root of the project repository.
Each project MUST `git ignore` the `build` folder.

## Build Folder Structure
Files and folder names MUST be lowercase.
The result of the build process should create a folder structure as follows:
```
.
└── build
    └── {platform}
        └── {project-name}.{ext}
```


Below is an example:
```
.
└── build
    └── windows
        └── jade-signer.{ext}
```

## Build Platform Targets
Below is a list of platforms we will target for each project
1. windows
2. linux
3. mac

## Docker-compose to create a build
Each project MUST have a /docker-compose.build.yml file.
The result of this is that every project MUST produce a build for each target platform when the following command is invoked:
 - `docker-compose up -f ./docker-compose.build.yml`

The docker-compose.build.yml file MUST be placed in the project's root directory.
Any dockerfiles used by the docker-compose may be placed at the discretion of the developer of the jade project.

## Build Pipeline
Starting from clean master branch with latest HEAD

### Building all targets
`docker-compose -f ./docker-compose.build.yml up` should create builds for each of the targeted platforms, and place the build artifacts in a folder structure outlined above.

### Building specific target
`docker-compose -f ./docker-compose.build.yml up [windows | linux | mac]`
