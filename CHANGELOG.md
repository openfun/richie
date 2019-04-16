# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic
Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Allow tagging persons with categories,
- A "Clear x active filters" button in the search filters pane lets the user
  remove all active filters with one click
- Add template and styling for persons list page,
- Add template and styling for categories list page,
- Add sub categories in category detail page.
  remove all active filters with one click.
- Show CTAs to Enroll on course glimpses in Search.
- Make the `RICHIE_ES_HOST` configurable in the sandbox

## Changed

- Harmonize how cards look on the site (grey border and white background),
- Move all the code demo site related to the demo site to its own application,
- Activating a filter that is a parent or child of a current active filter
  removes this active relative. This makes the experience of adding those
  relative filters more intuitive,
- Simplify Richie settings and provide defaults for those unlikely to be
  customized (search, languages, plugins, general),
- Change layout global background to darker grey,
- Improve 'categories' page layout,
- Every organization in a list is not displayed with an organization glimpse.

### Fixed

- Fix links between objects managed via plugins (e.g. categories on a course)
  that allowed draft links to display objects on public pages.

### Fixed

- Show the highlighted organization on course glimpses in Search.
- Show a placeholder image on course glimpses in Search when the
  cover for the course is missing.

## [1.0.0-beta.5] - 2019-04-11

### Added

- Enable parent/children filters in the filters pane in Search,
- Add a template filter to check if a placeholder is empty,
- Add a new "Assessment" section in the course page.

### Changed

- Hide empty placeholders from the course public page,
- Simplify the page creation wizard by reducing possibilities and automating
  object relations based on the navigation context:
  - ensure we are not creating duplicate slugs when creating a page,
  - reduce number of fields on form to create a new course run (remove languages
    and resource_link) and add a checkbox to easily snapshot the course when
    creating the course run,
  - automatically link courses with an organization when created from this
    organization's page,
  - create nested categories automatically when visiting the parent category
    page,
  - show button to create course runs only when visiting a course page and
    automatically link the course run to the current course,
  - hide button to create normal pages/subpages from wizard in sections governed
    by Richie.
- Translations are loaded dynamically in frontend application,
- Optimized frontend build in our official Docker image.

### Fixed

- Remove possibility to edit course title from the course run page as it breaks
  publishing.
- Fix an issue that crashed the app when a category was selected in search
  autocomplete.
- Committed CSS files are now included in the Docker image
- The python package now includes statics build in production mode

## [1.0.0-beta.4] - 2019-04-08

### Added

- Add i18n tooling to export strings to Crowdin, retrieve and compile
  translations, for the frontend and the backend. All translations are committed
  inside the project,
- Add links to switch language from the menu,
- Add social network badges in the footer, on course pages and on blog posts,
- Make categories configurable via the CMS, multi-dimensional and nested,
- Add blog post pages in a section called `News`,
- Update Elasticsearch indexes each time a page is modified and published,
- Improve fulltext search to match partial words,
- Add end-to-end tests for the search functionality to secure behavior.

### Changed

- Make site look generic and deploy it to richie.education,
- Build frontend in production mode,
- Upgrade to Python 3.7,
- Switch to indexing courses instead of course runs,
- Allow course run dates to be null. If a start date is null, the course run is
  `to be programmed`, if an end date is null, the course run (or its enrollment)
  is deemed to last forever,
- Use our own Elasticsearch image to allow running it with a non-root user,
- Move persons to the courses app,
- Rename database tables to `richie_*` to regain control of their name,
- Improve structure and packaging to allow using Richie as a third party
  application in another DjangoCMS project,
- Many cosmetic and UI fixes and improvements following first user feedbacks.

## [1.0.0-beta.3] - 2019-03-15

### Changed

- Improved Docker image: now it does not ship with the project sources but only
  with runtime-required requirements (_i.e._ the sandbox and richie's package
  installed globally).

### Fixed

- Richie templates now live in core instead of sandbox.
- Reorganize the search frontend to support nested filters.
- The CI now effectively tests packaging issues.
- The `apps.core.fields` module is no longer missing from Richie's package.
- Fixed the `bin/pylint` script to work with the default database engine
  (PostgreSQL)
- Fixed `rebuild` & `bootstrap` Makefile rules

## [1.0.0-beta.2] - 2019-03-13

### Added

- Users can create a custom taxonomy of categories in the CMS (eg. Subjects with
  Computer Science (incl. Algorithms & Data Structures), History, etc., and
  Levels with Beginner, Intermediate, etc.).
- Filters are dynamically generated by the backend to support custom meta
  categories (level 1 nodes in the category taxonomy) and fix structual issues
  with dates.
- Integrate the homepage and fill it with content in the demo-site.
- Integrate a design for the list of organizations page.

### Fixed

- Richie is compatible with MySQL, with database switching utilities and
  dedicated tests.
- Full-text searches also search in linked object names, such as categories &
  organizations.
- Make improvements to the demo site to make it more representative of
  real-world use.
- Don't break course pages if there is no linked organization.
- Fix i18n issues that broke the backend when using other languages than the
  default english.
- Prevent display glitches during loading of the courses search page.

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

This release indicates our intention to release richie 1.0. It also marks the
beginning of this changelog.

Here are the core features that enabled us to reach this milestone:

- index the courses, organizations & subjects (now categories) in ElasticSearch
  from the DjangoCMS models;
- create course snapshots to keep a history of the versions of a course Page
  throughout its various course runs;
- add full text search queries to the course Search;
- handle facet counts for all our filters in course Search;
- develop plugins for all essential parts: courses, organizations, categories,
  people, licences...

As we prepare to release, here are some improvements and fixes still ahead of
us:

- allow nesting of categories, to let users customize "meta" categories and
  build their own subtrees;
- finish integrating the missing pages and improve the sandbox environment;
- test and polish the use of richie as a django app / node dependency.

[unreleased]: https://github.com/openfun/richie/compare/v1.0.0-beta.5...master
[1.0.0-beta.5]: https://github.com/openfun/richie/compare/v1.0.0-beta.4...v1.0.0-beta.5
[1.0.0-beta.4]: https://github.com/openfun/richie/compare/v1.0.0-beta.3...v1.0.0-beta.4
[1.0.0-beta.3]: https://github.com/openfun/richie/compare/v1.0.0-beta.2...v1.0.0-beta.3
[1.0.0-beta.2]: https://github.com/openfun/richie/compare/v1.0.0-beta.1...v1.0.0-beta.2
[1.0.0-beta.1]: https://github.com/openfun/richie/compare/v1.0.0-beta.0...v1.0.0-beta.1
[1.0.0-beta.0]: https://github.com/openfun/richie/compare/11ec5d911b9a9097535adbbf4f62957a7ab05356...v1.0.0-beta.0
