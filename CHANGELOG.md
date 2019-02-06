# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic
Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0-beta.1] - 2019-02-06

### Added

- Publish a `master` tagged docker image to DockerHub. It is supposed to reflect
  the `master` branch state.

### Fixed

- The simple_text_ckeditor plugin was not discovered as a python module and thus
  not distributed with Richie's python package.
- The organization logo maximal size is now restrained to its container size.
- We no longer publish development images to DockerHub as they appear useless.

## [1.0.0-beta.0] - 2019-02-04

This release indicates our intention to release richie 1.0. It also marks the beginning of this changelog.

Here are the core features that enabled us to reach this milestone:

- index the courses, organizations & subjects (now categories) in ElasticSearch from the DjangoCMS models;
- create course snapshots to keep a history of the versions of a course Page throughout its various course runs;
- add full text search queries to the course Search;
- handle facet counts for all our filters in course Search;
- develop plugins for all essential parts: courses, organizations, categories, people, licences...

As we prepare to release, here are some improvements and fixes still ahead of us:

- allow nesting of categories, to let users customize "meta" categories and build their own subtrees;
- finish integrating the missing pages and improve the sandbox environment;
- test and polish the use of richie as a django app / node dependency.

[unreleased]: https://github.com/openfun/richie/compare/v1.0.0-beta.1...master
[1.0.0-beta.1]: https://github.com/openfun/richie/compare/v1.0.0-beta.0...v1.0.0-beta.1
[1.0.0-beta.0]: https://github.com/openfun/richie/compare/11ec5d911b9a9097535adbbf4f62957a7ab05356...v1.0.0-beta.0
