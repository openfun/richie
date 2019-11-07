# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic
Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Remove the "Exo 2" font from Richie. Use system `sans-serif` instead.
- Rename the `fun-react` class used to Django-React interop to `richie-react`.
- Improve documentation on Django-React interop.

### Fixed

- Fix undefined behavior on hits on the categories API from unrelated requests,
  return 404 errors instead.

## [1.12.1] - 2019-10-29

### Added

- Create a documentation & marketing website for the project. It lives under
  the `docs` folder and is deployed to Github Pages.

### Fixed

- Fix an API request issue that was breaking the `<RootSearchSuggestField />`
  component.

## [1.12.0] - 2019-10-23

### Added

- Add a variant option for course glimpses.
- Richie dependents can now run their own frontend build and override
  components through command line arguments and a dedicated settings file.

### Changed

- Rename {% block title %} to {% block head_title %} to avoid collision with
  H1 title,
- Wrap each section of the course detail template in a block to allow partial
  overrides,
- Rename `course-detail__aside__run` selector to `course-detail__aside__runs`
  in `course_detail.html` template to better reflect its content.

### Fixed

- HTML validation warnings and errors,
- In the sandbox, make API calls work behind an htaccess by removing Basic
  Auth fallback,
- Adding person/organization plugins to a new blank course,
- Remove multiple "h1" tags on homepage, section template will always have a
  default level title of 2.

## [1.11.0] - 2019-10-11

### Added

- Make stylesheet links overridable in the base template

## [1.10.0] - 2019-10-08

### Added

- Add plugin to embed organizations by their category on any page,
- Display related organizations on category detail page,
- Add a variant option for organization glimpse,
- Allow tagging organizations with categories,
- Allow second level children in footer menu.

### Changed

- When displaying objects related to a category, include objects related to
  the categories' descendants,
- When displaying related objects on a category, respect page tree ordering,
- The filters pane in course search is now a sliding drawer on mobile,
- Use SVG icons instead of an icon font.

### Fixed

- Fix add plugin to team and organization on fragment_course_content template
  when they are empty.

### Removed

- Anti-pattern in factories to create related objects from the targeted page.

## [1.9.2] - 2019-09-20

### Fixed

- Logo image location wrongly targetted in base.html new SEO tags.

## [1.9.1] - 2019-09-20

### Added

- Add an UPGRADE.md file to document upgrade instructions.

### Changed

- Update and include the latest version of translations.

## [1.9.0] - 2019-09-18

### Added

- Add a React-powered course search field that can live anywhere in Richie.
- Add breadcrumbs element on all pages but the listing ones.
- Add a new page type for programs as a collection of courses.
- New dependency "dj-pagination" to enable pagination on blogpost list
  and person list.
- Add basic SEO tags with some more relevant ones in page details.

### Changed

- Refactor course search field to make it reusable.
- Upgrade crowdin image used in circle-ci to version 2.0.31 including
  tar command.

### Fixed

- Translate login/signup on header.

## [1.8.3] - 2019-09-03

### Fixed

- Allow overriding Richie's default settings in inheriting configurations

## [1.8.2] - 2019-08-29

### Changed

- Include up-to-date translation files including binaries (.mo).

## [1.8.1] - 2019-08-29

### Fixed

- Fix "More options" modal for searchable filter values not based on MPTT
  paths (eg. "Person" in the sandbox environment).
- Improve pagination UX by increasing contrast between the active page number
  and others, and making button clickable areas larger.
- Stop making failed API requests and instead show a helpful error message
  in the "More options" modal for filter values when the user inputs their
  first 1 or 2 characters.
- Improve pagination strings for localization.

### Security

- Update the mixin-deep and set-value packages to safe versions.

## [1.8.0] - 2019-08-28

### Added

- Show a "More options" button along with a modal to find more filter values
  for each filter in the search filters pane in course search, only when there
  are more values to be found.

### Fixed

- Fix missing author name on blogpost detail pages because of an error in
  the person plugin template.
- Fix search API endpoints for categories, organizations & persons.

## [1.7.3] - 2019-08-27

### Fixed

- Fix logo url in footer.

## [1.7.2] - 2019-08-26

### Fixed

- Change location of core static files so fonts can be found.

## [1.7.1] - 2019-08-23

### Fixed

- Add woff2 in MANIFEST.in so new font is included in Python package.

## [1.7.0] - 2019-08-21

### Added

- Paginate the course search results view.
- Add a CSS helper class make content available only for users
  of assistive technologies.

### Changed

- Display category icons on the course detail view but not on the glimpse.
- Autosuggestion endpoints are diacritics insensitive.

## [1.6.1] - 2019-08-03

### Fixed

- Move the page title in Search so it can be placed correctly in the
  page structure.

### Changed

- Use the "Exo 2" font throughout Richie.

## [1.6.0] - 2019-07-25

### Added

- Configure roles and permissions in the demo site.

### Changed

- Factorize the code creating roles & permissions for organizations & courses,
- Display an icon on the course glimpse (the first among the course's icons),
- Add icons to the course detail page via a constrained placeholder,
- Add an icon to the category detail page via a constrained placeholder,
- Add icon image to the category search index,
- Add icon image to the course search index.

### Fixed

- Fix `get_placeholder_plugins` template tag when the placeholder is missing,
- Stop limiting course getters to specific placeholder names on all objects.

## [1.5.2] - 2019-07-15

### Changed

- Improve english date on course page,
- Improve course glimpse text formatting.

### Fixed

- Remove asserts and prepare codebase for activation of `bandit` linter.

## [1.5.1] - 2019-07-11

### Fixed

- Fixed typos in header-related SCSS variable names,
- Fix non-conformities in blogpost, category, organization & person glimpses,
- Fix lodash, lodash-es, handlebars vulnerabilities by upgrading versions.

## [1.5.0] - 2019-07-03

### Added

- Add a section "What you will learn" to the course page.

### Fixed

- Fix language confusion when getting objects that are related to a course via
  a plugin (organizations, categories and persons),
- Use empty image alt text & no link title text for course glimpses to comply
  with accessibility standards (existing alts & titles were redundant).
- Fix an issue that caused inconsistent UI and broken search results when
  selecting a suggestion in course search.

## [1.4.1] - 2019-06-26

### Changed

- Improve the layout for the person details page.

### Fixed

- Improve label text for the child filter toggle in Search.

## [1.4.0] - 2019-06-26

### Added

- Add a catchphrase on top of the course detail view.
- Allow configuring max length and CKeditor on specific placeholders for text
  plugins, and propose default configurations using this new feature.

### Changed

- Improve handling of organization-related images to prevent unwanted cropping
  of organization logos.
- Change the person bio to a plain text plugin.

## [1.3.0] - 2019-06-20

### Changed

- Add course effort and duration values to demo site.

### Removed

- Replace first name, last name and person title by page title.

### Fixed

- Add missing translation when displaying effort and duration on the course.

## [1.2.0] - 2019-06-19

### Added

- Add field on course to record effort (e.g 5 hours/day) and duration
  (e.g 4 weeks),
- Add a new plugin to easily create HTML sitemaps.

### Fixed

- Fix thumbnail definition for the image glimpse used on the search page.

## [1.1.0] - 2019-06-05

### Changed

- Allow only formatted texts or images in course complementary information,
- Simplify why permissions are required to create Richie extension pages,
- Show course creation wizard only on organization pages.

### Fixed

- Fix giving permissions on a course filer folder to its organization admins.

## [1.0.1] - 2019-06-05

### Fixed

- Fix page permissions that ended-up being considered as view restrictions
  making all organization and course pages private,

## [1.0.0] - 2019-05-29 🎉

### Added

- Add sensible defaults for third party settings that Richie requires,
- Add a home page to the site structure to avoid a 404 error on startup.

### Changed

- Make sure the `recursive_page_creation` helper respects an existing home
  page and plays well with multiple sites,
- Configure Django settings to pass all heartbeat checks,
- Make filter autosuggestions dynamic based on backend settings. Also runs
  separate autocompletion requests for each meta category and shows them
  under their separate titles.

### Fixed

- Fix `blockplugin` templatetag breaking all pages using it when in edit mode,
- Fix error when one of the site's languages was not found in ALL_LANGUAGES.
- The `richie_init` job is now idempotent and can thus be run multiple times.

## [1.0.0-beta.9] - 2019-05-22

### Added

- Replace DjangoCMS picture plugin by our simple picture plugin: only one
  field to upload the image, all attributes that control how the image is
  resized, cropped and displayed are now in the code,
- In the sandbox project, configure Django Filer to serve private files,
- Create a user group for each course and give it the permission to manage
  pages below the course (snapshots and course runs),
- Create a folder in Django Filer for each organization and for each course,
- When a new course is created for an organization, automatically associate
  permissions to organization admins (as defined in settings or with sensible
  defaults),
- Configure permission checks on page creations via the CMS wizard,
- Automatically create a page role and associate admin permissions when a new
  organization page is created (as defined in settings or with sensible
  defaults),
- Add page roles to link a user group to a CMS page, searchable via the admin,
- Add page roles to link a user group to a CMS page,
- Add a persons index and viewset to enable text queries and autocomplete
  requests on person names from the API.
- Index person names on courses to allow users to find courses when they
  type a related person's name in full text search.
- Add a persons filter to the course Search view and suggest persons in
  autocomplete search field.
- Add a management command to create the required site structure,
- Allow to dynamically set webpack publicPath. This is useful if a CDN is used
  to load statics. Define the settings `CDN_DOMAIN` and it will be used as base
  domain to fetch js chunks.

### Changed

- Restrict course content to plain text in standard sections,
- Change the order of placeholders on the course page following feedback from
  our support team,
- Simplify the Docker development stack to have a single `Dockerfile` and
  docker-compose configuration for testing either with MySQL or PostgreSQL
  database backend
- Standardize the project's `Makefile` to make it more easily maintainable by
  our peers
- Database ports are no longer exposed in the development environment

### Removed

- Alpine images are no longer maintained and have been removed from the project

### Fixed

- Fix production image by removing dependency to `factory` in production code,
- Fail and return a meaningful error when an invalid slug is submitted in
  page creation wizards,
- Fix person placeholders mistakenly showing on the organization page,
- Fix serializer that was failing for a course indexed with no organization,
- The language filter, which is not a drilldown filter, no longer behaves
  like one. Ditto for any future similar filters,
- All children are now shown when a parent filter value is "opened", instead
  of just the top 5 by facet count.

## [1.0.0-beta.8] - 2019-04-24

### Added

- Link persons to a random set of organizations in the demo site,
- Add organizations to a person via plugins on the person detail page,
- Show related persons on the organization detail page,
- On a person detail page, show courses to which s.he participated and
  blogposts s.he authored,
- Show results count in the course search results list.

### Changed

- Search as the user types in the course search field. This replaces
  autosuggest in course names with a full index search,
- Prevent search filters from jumping around by displaying facets with zero
  results as disabled and always reserving the space for the "Clear filters"
  button,
- Improve demo dataset by assigning each person to an organization,
- Use checkboxes to enable/disable filters in search page,
- Improve autosuggest tests to increase reliability.

### Fixed

- Use proper HTML elements for accessibility of search filter groups.

## [1.0.0-beta.7] - 2019-04-17

### Changed

- Update French and Canadian French `.po` files with the latest translations.

### Fixed

- Fix broken `hub` job in CI publishing the Docker image,
- Fix a display glitch with parent filters when active.

## [1.0.0-beta.6] - 2019-04-17

### Added

- Allow tagging persons with categories,
- A "Clear x active filters" button in the search filters pane lets the user
  remove all active filters with one click
- Add template and styling for persons list page,
- Add template and styling for categories list page,
- Add sub categories in category detail page.
- Show CTAs to Enroll on course glimpses in Search.
- Make the `RICHIE_ES_HOST` configurable in the sandbox

### Changed

- Harmonize how cards look on the site (grey border and white background),
- Move all the code related to the demo site to its own application,
- Activating a filter that is a parent or child of a current active filter
  removes this active relative. This makes the experience of adding those
  relative filters more intuitive,
- Simplify Richie settings and provide defaults for those unlikely to be
  customized (search, languages, plugins, general),
- Change layout global background to darker grey,
- Improve 'categories' page layout,
- Every organization in a list is now displayed with an organization glimpse.

### Fixed

- Fix links between objects managed via plugins (e.g. categories on a course)
  that allowed draft links to display objects on public pages.
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

[unreleased]: https://github.com/openfun/richie/compare/v1.12.1...master
[1.12.1]: https://github.com/openfun/richie/compare/v1.12.0...v1.12.1
[1.12.0]: https://github.com/openfun/richie/compare/v1.11.0...v1.12.0
[1.11.0]: https://github.com/openfun/richie/compare/v1.10.0...v1.11.0
[1.10.0]: https://github.com/openfun/richie/compare/v1.9.2...v1.10.0
[1.9.2]: https://github.com/openfun/richie/compare/v1.9.1...v1.9.2
[1.9.1]: https://github.com/openfun/richie/compare/v1.9.0...v1.9.1
[1.9.0]: https://github.com/openfun/richie/compare/v1.8.3...v1.9.0
[1.8.3]: https://github.com/openfun/richie/compare/v1.8.2...v1.8.3
[1.8.2]: https://github.com/openfun/richie/compare/v1.8.1...v1.8.2
[1.8.1]: https://github.com/openfun/richie/compare/v1.8.0...v1.8.1
[1.8.0]: https://github.com/openfun/richie/compare/v1.7.3...v1.8.0
[1.7.3]: https://github.com/openfun/richie/compare/v1.7.2...v1.7.3
[1.7.2]: https://github.com/openfun/richie/compare/v1.7.1...v1.7.2
[1.7.1]: https://github.com/openfun/richie/compare/v1.7.0...v1.7.1
[1.7.0]: https://github.com/openfun/richie/compare/v1.6.1...v1.7.0
[1.6.1]: https://github.com/openfun/richie/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/openfun/richie/compare/v1.5.2...v1.6.0
[1.5.2]: https://github.com/openfun/richie/compare/v1.5.1...v1.5.2
[1.5.1]: https://github.com/openfun/richie/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/openfun/richie/compare/v1.4.1...v1.5.0
[1.4.1]: https://github.com/openfun/richie/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/openfun/richie/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/openfun/richie/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/openfun/richie/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/openfun/richie/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/openfun/richie/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/openfun/richie/compare/v1.0.0-beta.9...v1.0.0
[1.0.0-beta.9]: https://github.com/openfun/richie/compare/v1.0.0-beta.8...v1.0.0-beta.9
[1.0.0-beta.8]: https://github.com/openfun/richie/compare/v1.0.0-beta.7...v1.0.0-beta.8
[1.0.0-beta.7]: https://github.com/openfun/richie/compare/v1.0.0-beta.6...v1.0.0-beta.7
[1.0.0-beta.6]: https://github.com/openfun/richie/compare/v1.0.0-beta.5...v1.0.0-beta.6
[1.0.0-beta.5]: https://github.com/openfun/richie/compare/v1.0.0-beta.4...v1.0.0-beta.5
[1.0.0-beta.4]: https://github.com/openfun/richie/compare/v1.0.0-beta.3...v1.0.0-beta.4
[1.0.0-beta.3]: https://github.com/openfun/richie/compare/v1.0.0-beta.2...v1.0.0-beta.3
[1.0.0-beta.2]: https://github.com/openfun/richie/compare/v1.0.0-beta.1...v1.0.0-beta.2
[1.0.0-beta.1]: https://github.com/openfun/richie/compare/v1.0.0-beta.0...v1.0.0-beta.1
[1.0.0-beta.0]: https://github.com/openfun/richie/compare/11ec5d911b9a9097535adbbf4f62957a7ab05356...v1.0.0-beta.0
