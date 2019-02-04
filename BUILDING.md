# Building

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [BCP 14](https://tools.ietf.org/html/bcp14) [RFC2119](https://tools.ietf.org/html/rfc2119) [RFC8174](https://tools.ietf.org/html/rfc8174) when, and only when, they appear in all capitals, as shown here.

This document is licensed under [The Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0.html).

When using the name 'version' we mean the versioning scheme described in [VERSIONING.md](VERSIONING.md)

## Introduction

This document is to describe the functionality a project MUST provide in terms of creating build artifacts. It also describes the structure in which project's MUST write build artifacts in.

A project MUST provide:

 - a folder name convention for build artifacts
 - a folder structure for the above-mentioned build artifacts folder
 - a list of targets
 - a file called `bin/build.{target}.{ext}` to target each of the build targets
 - a build pipeline given the above pretext

The purpose of having a uniform way of producing a build is that we may ALL produce builds for any of the projects, making the onramp for new developers less steep, while still maintaining an exceptionally high level of quality.

The projects should follow the 'architecture as code' principle - and should require a very minimal set of dependencies. 

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
    └── {target}
        └── {project-name}.{ext}
```


Below is an example:
```
.
└── build
    └── windows
        └── my-build.exe
```

## Build Targets

Below is a list of suggested targets for a project
1. windows
2. linux
3. macos

## Build script

Each release target MUST have a `bin/build.{target}.{ext}` file.

The result of this is that every project MUST produce a build for each target when the following command is invoked:

```
bin/build.{target}.{ext}`
```

The file MUST be placed in the project's `bin` directory.

## Build Pipeline

### Building targets

`bin/build.{target}.{ext}` should create builds for each of the targets, and place the build artifacts in a folder structure outlined above.

### Windows

```
bin/build.windows.bat
```

### Linux

```
bin/build.linux.sh
```

### Macos

```
bin/build.macos.sh
```
