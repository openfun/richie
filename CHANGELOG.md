# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic
Versioning](https://semver.org/spec/v2.0.0.html).

## [Unrealeased]

### Fixed

- Fix course enrollment count shouldn't include the hidden runs.
- Fix RDFa errors on Google Search Console

## [2.28.1]

### Fixed

- Fix ProductCertificateFooter component to display proper CTA
  according to Order state

## [2.28.0]

### Changed

- Disable button to sign a contract in learner dashboard
  if the order is not validated

### Fixed

- useDateFormat did not return undefined with null values
- PurchaseButton instantiated a hook conditionnaly
- Make UserHelper manages OpenEdxProfile object to extract name
- Do not display unpublished children categories in the public 
  category detail page

### Added

- Load React JS bundles from CDN on all pages

## [2.27.0]

### Added

- Add `SaleTunnelNotValidated` step into `SaleTunnel`
- Add WarningIcon component

### Changed

- Improve Lyra error management to abort payment properly

### Fixed

- Use CB logo as fallback if credit card is unknown
- Put CunninghamProvider at root level
- Resubmit order on payment failure
- Render course run resource link with button look'n feel when it does not match
  a LMS Backend
- Manage display of CourseRun dates when end date and/or enrollment date are
  undefined

## [2.26.0]

### Added

- The enrollment's certificate tab in learner dashboard is no longer
  displayed when the list is empty.
- User profile in the learner dashboard is now always synchronized with 
  openEdx profile information.
- Add a tab in learner dashboard certificate page to render both order
  certificate and enrollment certificate lists.
- Add Lyra payment interface
- Add 404 error page on the dashboard router.
- Teacher dashboard route now redirect to learner dashboard route when
  the user isn't authorized.
- Add two new sections in DjangoCMS courses: Accessibility and Required
  Equipment.
- Ongoing product displayed on the syllabus without active enrollment
  now link to the order details page in the learner dashboard.
- Add new sale tunnel

### Changed

- Upgrade to Python 3.11
- Upgrade to Django version 4.2 (pin version < 5)
- Migrate to Sentry SDK 2.0

### Fixed

- Filter out inactive enrollments in the learner dashboard
- Prevent title to overflow in DashboardItem component
- Fix an issue on dashboard search when no results were reached 
- Ongoing product displayed on the syllabus with an active enrollment
  now link to the order details page in the learner dashboard instead of
  OpenEdx course.
- Downloaded contract archive on product page was broken, it now works
  properly by sending the course_product_relation_id in the archive
  creation request.
- Fix a bug in the learner dashboard contract page where an alert
  message was displayed on successful download.

## [2.25.1]

### Fixed

- Duplicated `course_format` placeholder in `course_detail` template

## [2.25.0]

### Added

- Add a form to edit user fullname in the payment step of the sale
  tunnel.
- Add ready-only user profile in the learner dashboard preferences page.
  This profile display data from LMS profile.
- Management command to migrate course runs course link to joanie
- Add search bar on learner dashboard courses pages.
- Add a `CertificateHelper` implementing a `getCourse` method
- Add search bar on teacher dashboard courses pages.
- Add background colors to default user's avatar when they're used
  in a list. Theses colors are generated from user's fullname and
  configurable with cunningham tokens.
- Add dedicated messages for order's status when they're visualized on
  the teacher dashbaord.
- Add Organization block to order details.
- Add teacher dashboard page to list training's learners. This listing
  can be accessed under a training or an organization's training.
- Add a "more" button to DashboardItem and Orders containing a link to
  go to syllabus
- `related_organizations` placeholder on organization detail page

### Changed

- Learner list in teacher dashboard are always fitered by
  organization id.
- Upgrade docker compose to v2.24.5
- remove dashboard i18n routing
- Complete `course_detail` RDFa markups
- Require to accept terms when purchasing product of any kind
- Rename trainings root menu entry label
- Upgrade to node 20
- Contract list in the teacher dashbaord are now filtered by
  courseProductRelationId instead of courseId and productId.
- Switch from setup.cfg to pyproject.toml

### Fixed

- No results message is no longer displayed on initial loading in
  learner and teacher courses list pages.
- Manage certificate linked to an enrollment
- Certificate products are not listed anymore in teacher dashboard
- Fix several SaleTunnel cache issues
- Fix course access link in learner dashboard. This link must not be
  display when the course isn't open.
- Fix CreditCardHelper
- Remove enrollment start on some course run
- Fix Organization glimpse card variant logo size
- Fix joanie's course run link to LMS course in the syllabus page.
- Fix enrollment cache not invalided after buying certificate product.
- Fix a typo on ContractStatus component

## [2.25.0-beta.1]

### Added

- Add bulk signature on teacher dashbaord organization's course list page.
- Add signature polling description
- Add Course run link into Order detail view

### Fixed

- Fix on teacher dashboard courses list. During infinit scroll loading the
  window scroll was reset at the top of the page.
- Fix impossible logout issue
- Add signature polling description
- Fix malformed CourseProductItem Order dashboard links
- Await logout authentication request logout trigger
- Fix search facets count metadata issue (ignore not listed courses)
- Fix `getCourseGlimpseProps` method to handle localized course urls

## [2.25.0-beta.0]

### Added

- Add contracts bulk download button in teacher dashboard contract list page.
- Change menu link order on the learner dashboard sidebar.
- Organization bulk contract signature
- Add a Badge React component
- Add a footer on enrollment's item in the learner dashboard. It give the
  possibility to purchase linked product or download linked certificate.
- Add download contracts pages on the teacher dashboard.
- Add a contract information and actions in learner dashboard order's
  listing and details.
- In the learner dashboard, enroll actions are disabled when an unsigned
  contract is linked to the order.
- Add the ability to sign an order's contract.
- Add terms checkbox and specific "sign" button in the Sale Tunnel.
- The CourseRunProductItem disables enrollment if there is a needed signature.
- Handle OrderGroup on product purchase

### Changed

- Teacher dashboard access is restricted to user which has access to a course
  or an organization.
- Frontend Order type have been split into two: CredentialOrder and
  CertificateOrder.
- Update PurchaseButton messages to aid with translation.
- Update courses and organizations default permissions
- Update cunningham to 2.0.0
- Update frontend components OrderStateMessage with new computed state
  'waiting signature'
- Update SaleTunnel to add certificate product course run information.
- Update SaleTunnel to display product instructions.
- When a course have multiple seller organizations, CourseGlimpse now display
  the number of seller organization instead of the title of the first one.
- Update `JOANIE_BACKEND` settings, frontend widgets and learner dashboard
  to match new API endpoint to retrieve course products
- Use cunningham Button component.
- Use cunningham form components (input, select, radio, checkbox).
- Delete richie Button component now that we use cunningham Button component.
- Delete courseRun.starts_in_message, we compute it on frontend side.

### Fixed

- Fix typo on the DashboardOrderLoader component.
- Prevent LTIConsumer component to rerender on user session update
- Fix Order interface against changed field 'target_enrollments' and
  'enrollment'
- Fix dashboard mobile layout.
- Course details characteristics overflow issue
- Map all richie course properties into `getCourseGlimpseProps` util
- Fix course run computed state. A run without end date must be ONGOING_OPEN
- Fix cookiecutter circleci gitlint configuration
- Opened Course Run show empty date as '...'
- Fix dashboard enrollment listing when they're linked to a product certificate.
- Fix order cache issues

### Removed

- Remove `course_enrollment_widget_props` extra tags
- Remove `CourseProductItem` as a widget

## [2.24.1] - 2023-08-30

### Fixed

- Fix django templates using course-glimpse-list block

## [2.24.0] - 2023-08-29

### Added

- Add tracking events on product interactions
- Add `display_mode` choice field to `CourseRun` model

### Changed

- In `SaleTunnelStepValidation`, allow user to show/hide target course details

## [2.23.0] - 2023-07-28

### Added

- Retrieve enrollment status for ongoing course runs
- Add a shortcut route to redirect to the course page through a course code.
- Add cunningham and design system.
- Specific sidebar for order related routes
- List teacher's course's course runs in the teacher course dashboard page.
- Teacher dashboard course list now includes courses and courses product
relations.
- Add a page for training details (courseProductRelation) in the teacher
dashboard.
- Add a link to the LMS course run session in teacher dashbaord course run lists
- Finalize the design of teacher dashboard organization sidebar.
- Use union of organization courses and course product relations on organization
course's listing page.
- The product purchase button is now disabled and display a contextual
information message when the product have no remaining order.
- Add all available languages for the course in the characteristics section
on the course details page.
- Change footer text and remove datime on glimpse course according state.

### Changed

- Bind `settings.FEATURES` into `FRONTEND_CONTEXT['context']`
through `context_processor`
- Show original language name on the menu instead of translating it on the
  current language.
- Replace helix factories by homemade engine using typescript.
- Use css colors from cunningham instead of palette.scss
- Improve the design of the dashboards layouts.
- Improve the design of the dashboards sidebars.
- Move course's syllabus course runs list to React.
- Migrate wishlist to new API.

### Removed

- Remove unused route in teacher dashboard.
- Fix teacher dashbaord breadcrumb.

## [2.22.0] - 2023-04-20

### Added

- Add head_js block into base html template
- List teacher's courses in the teacher courses dashboard page.
- Added Certificates in the dashboard
- Dashboard infinite scroll of orders and enrollments
- list teacher's courses in the teacher courses dashboard page.

### Fixed

- Fix error `MultipleObjectsReturned` during synchronization due to missing
  `distinct`.
- Fix images sizes for course detail cover and organization banner

## [2.21.1] - 2023-04-04

### Fixed

- Layout issue on enrollable course run of CourseProductItem

## [2.21.0] - 2023-03-21

### Added

- Add CourseAddToWishlist button to add/remove a course from users wishlist
- Added Enrollment's pagination in the dashboard
- Allow multiple web analytics providers at the same time.
- Display `localizedMessage` on Course Enrollment when backend has
  `localizedMessage` on the 400 error payload
- Navigation skeleton of the teacher dashboard

### Fixed

- Fix form styles to suffix input label with "*" when a select,
  radio or checkbox input is required
- Button can be use with a className prop

### Changed

- Rename web analytics providers, from `google_analytics` to
  `google_universal_analytics`. The `google_tag_manager`
  now uses the correct `gtm.js` and the `google_tag` uses the `gtag.js`.
  Replace the multiple web analytics settings with a single
  `WEB_ANALYTICS` dict setting.
  The location logic of web analytics js code has been moved to be
  inside the `web_analytics.html` template.
- For performance reasons the default location for the web analytics js code
  have been changed from `head` to `footer`.
- Rename product.certificate to certificate_definition due to Joanie API update.
- Rework frontend file architecture
- Hide unenroll button on CourseProductItem widget

## [2.20.1] - 2023-02-22

### Fixed

- Fix a style bug on the course glimpse when used in a section
  with variant overriding svg color

## [2.20.0] - 2023-02-17

### Added

- Added DashboardItemOrder that allows to select course runs
- Add make dbshell cmd to access database in cli
- Added support for courses-run managed by Joanie
- Display message to user when product course it is enrolled is not yet started
- Add feature flags system with settings and template tag.

### Fixed

- Prevent internal server error when course runs sync webhook targets
  a course page having a snapshot

## [2.19.0] - 2023-02-03

### Added

- Display 'pending' label on CourseProductItem when user owns pending order

### Changed

- Improve accessibility by using darker color for info course detail label
- Update Joanie connection documentation
- Display error message when CourseProductItem has error

### Fixed

- Fix an issue about CourseProductItem when session state is updated
- Prevent `.icon` to shrink in flexbox content

## [2.18.0] - 2023-01-12

### Added

- Allow synchronizing course runs in bulk via the same API hook
- JoanieBackend to identify course runs managed by Joanie

### Changed

- Migrate to useResources hooks
- Refactor CourseProductItem as Joanie products are Richie course runs
- Use versionned Joanie api routes
- Migrate to React 18 and React-Query v4

### Fixed

- Prevent product course run enrollment when user owns the product
  through an invalid order
- Display a message in the sales tunnel when at least one course has no course
  runs, to say that this product is not currently available for sale.
- Show error message when user tries to enroll or unroll to a
  course run and the requests fails
- Fix courses badges css.
- Fix style in edit mode on courses with catalog visibility with
  `course_only` or `course_and_search`.


### Removed

- Remove CourseProductsList React widget

## [2.17.0] - 2022-10-28

### Added

- Add Dashboard router
- Add generic dashboard component
- Add dashboard components for Order, Enrollment
- Add dashboard components for Credit Card management
- Dashboard addresses management components
- Add dashboard layout

### Changed

- Allow editor to enforce `inline_ratio` and `is_automatic_resizing` values
  for a lti consumer plugin based on a lti provider
- Use new Joanie Enrollment resource type
- Modal component refactor for homogeneous use
- New global scroll behavior for Modal
- Add disabled style for inputs
- Add a visually hidden title on video player iframes, meant to be announced
  to screen reader users
- Improve sale tunnel accessibility, especially when using a keyboard
  or screen reader

### Fixed

- Fix course run synchronization when no-update fields are declared (broken
  since Richie version 2.15.0)
- Unlocalize aspect ratio floating value rendered in lti_consumer template
  to always display value with a dot no matter active language
- Language choices should be ordered alphabetically in course run admin form

## [2.16.0] - 2022-09-09

### Fixed

- Add pip requests package for open edx lms backend.
- Fix several issues about cookiecutter template

### Added

- Display error messages in `AddressForm`
- Add dns prefetch and optionally preconnect to media cdn
- Add StorybookJS to frontend with various existing components.

### Changed

- Refactor filter definition methods to simplify writing custom filters
- Improve filters configuration to allow easier customization
- CKEditor basic configuration should allow to include target on anchors
  for course fields: assessment, format and prerequisites.
- Allow form messages to go on multiple lines
- On the search page, improve accessibility of the filters pane when using a
  small screen

##  [2.15.1] - 2022-08-10

### Changed

- Upgrade to Django CMS 3.11

### Fixed

- Import the missing stylesheet of AddressesManagement component

##  [2.15.0] - 2022-06-22

### Added

- Get a unique LTI Context per user
- Add a `DashBoard` React based view
- Add API endpoint to search & autocomplete licences
- Add licences-based filters on course search
- Add a pace filter on course search

### Changed

- Migrate code and type to comply with the new Joanie API
- On blogpost detail view, move categories list on the right side
- Fake authentication interface when using the `base` api interface
- Avoid lag experienced by user on logout by not waiting for the logout request
  to succeed
- Improve Sale Tunnel UX
- Improve sale tunnel theme overriding
- Improve html header, menu and footer structure for better keyboard and
  screen reader UX
- Improve overall accessibility, especially for screen reader users,
  on all content pages: category list, category details, blogpost list,
  blogpost details, program list, program details, organization detail.
- Use `em` based media queries instead of `px` based media queries to fix all
  UI bugs when using the website with a huge text-only zoom
- Upgrade documentation to use Docusaurus version 2
- Refactor frontend scss code. Add `_index.scss` on each folder so the
  `_main.scss` could be more compact. Add `!default` to homegrown Richie
  shared scss settings/variables.

### Fixed

- Fix header layout issue when logo height is big
- Fix `components.SaleTunnelStepPayment.userBillingAddressNoEntry` misspell
- Remove z-index of course glimpse icon to fix an overlay issue
- Fix erratic frontend test failure
- Allow to configure multiple elasticsearch hosts

### Removed

- PurchasedProductMenu frontend component

##  [2.14.1] - 2022-04-07

### Fixed

- Preserve query string on language switch
- Fix search query string formatting
- Fix a course glimpse title color issue when used within a section with variant

##  [2.14.0] - 2022-04-01

### Added

- Add a `CourseProductList` Component
- Add a `SaleTunnel` component
- Add an `AddressesManagement` component
- Add a `PaymentButton` component
- Add a `PaymentInterface` component to lazy load the right payment component
  according to the provider used
- Create a `StepBreadcrumb` component to display progress within a step process
- Create a `useStepManager` hook to manage step process
- Create a React `Icon` component that can optionally take alternative text
  for screen reader users.
- Add a heading for screen reader users on the search results page to have a
  more understandable navigation.
- Add new page templates for various multiple columns and their own CSS to
  adjust every possible plugins to fit correctly;
- Add theme variable to change checkmark color.
- Add new placeholder 'excerpt' to Organization detail template
- Add the website's name by default in every page title, that can be changed
  or disabled by overriding the new `site_title` and `site_title_separator`
  blocks
- Add alternative text on course glimpse icons for screen reader users
- On search page, warn screen reader users when the search results change
- On search page, the "clear filters" button now have details on current
  filters for screen reader users
- Add a `__stretched-link` element to the card css block to help make
  screen reader-friendly card links

### Changed

- Remove the use of Google Fonts
- Improve overall accessibility in Richie templates
- Move enroll button for the first open course run below the contact block.
  If there are more than one open run, they're all still shown on course
  detail aside block.
- Update frontend overriding system to allow to override any frontend module.
- Improve React search suggestion field labels for screen readers.
- Removed usage of deprecated Sass division '/' operator in favor of
  'math.div'.
- Organization plugin variant 'row' now use excerpt if not empty else the
  description with every markup removed
- Set font size to 1rem on some detail pages contents: Organization
  excerpt, Program body and Person main content
- Use anchors instead of buttons in search pagination to let users open pages
  in new tabs if they want
- Improve the `offscreen` class implementation to prevent potential visual
  issues for sighted user keyboards
- Change how course glimpse anchor is structured (allows text selection
  in the course glimpse + better screen reader user experience)
- Add context for screen reader users on search filters "more options" buttons
- On course page, make the organization image link clearer for
  screen reader users with a better alternative text
- Change how program glimpses HTML is structured to be clearer when using
  a screen reader
- Specify that we are on a course page in the course detail page title
- Remove contact block on course detail page

### Fixed

- Clear session cache on login and register
- Make useCourseSearch hook locale sensitive
- Stop using {% blockplugin %} template tags in <header> and replace them by
  simple {% if %} tags that do the same and don't inject frontend editing markup
- Fix `get_placeholder_plugins` when placed in <header> by refactoring and
  introducing new `placeholder_as_plugins` template tag
- Prevent context processor error when WEB_ANALYTICS_ID setting is not defined.
- Fix autocomplete views tests that may failed because of result order.
- Fix section tile title with richtext and special character escaping.
- Change blogpost detail template to display author even in published mode
  except if its placeholder is empty.
- Fix missing styles for Organization plugin 'row' variant link wrapper
- Fix course glimpse layout when organization logo is too narrow
- Fix course run deletion when translation title is empty
- Reordered course glimpse text order in the DOM for better screen reader
  support.
- On course page, make the course title the first thing that is read to
  screen readers (instead of the badges)
- Fix program glimpse heading level being too high on course detail page
- Hide title _To be scheduled_, _Upcoming_, _Ongoing_ and _Archived_ when all
  course runs have catalog visibility `hidden`.

## [2.13.0] - 2022-02-18

### Added

- Send web analytics event when a user enrolls to a course using the
  LMS enrollment api.
- Wrap React widgets in a `ErrorBoundary`
- Add settings to setup Joanie
- Add course runs to the course search API
- Add autocomplete feature on Page select in page related plugins

### Changed

- Differentiate between Google Analytics and Google Tag Manager js code as
  different Web Analytics providers.
- Show organization acronym by using the `menu_title` field (if set) on
  the organization page.
- Improve pagination blocks labels for screen reader users when there are
  multiple pagination components on one page
- Use the new `createWebStoragePersistor` to persist React query state
- Upgrade mysql to version 8

## [2.12.0] - 2022-02-04

### Added

- Create a React `Banner` component
- Add catalog visibility field to course run so it's possible to hide a
  course run on the catalog and/or hide it completely. Possible values
  are `course_and_search`, `course_only` and `hidden`.

### Changed

- Upgrade to Python 3.10,
- Do not use absolute positioning to place course glimpse metadata
- Improve semantic of glimpses

### Fixed

- Hide unpublished objects from list views (category, person and program)
- Add missing translation within search autocomplete menu
- Fix a layout issue on autosuggest search menu
- Fixed a layout issue on course glimpse
  when organization title and course title are too long
- Add missing language parameter in LTI requests issued by LTI consumer plugin

## [2.11.0] - 2022-01-04

### Changed

- Rename `branding_footer` template block to `body_footer_brand` in
  `richie/base.html`and include link it can be customized.
- Refactor scss color variables to be more easily customizable.

### Fixed

- Make LMS authentication optional.

## [2.10.0] - 2021-12-27

### Added

- Add Russian translations
- Add infinite scrolling to the facet search modal in course search.
- Add reusable form components
- Fix blogpost header image aspect ratio and sizes.
- Add theme property to `Spinner` component
- Add setting to limit the number of archived course runs displayed by
  default on a course detail page.
- Add timing function variables
- Add a `outline` variant to button
- Create a `shadowed-box` mixin
- Add a meta description default value from course introduction,
  blog excerpt, category description, person bio, program excerpt
  and organization description
- Improve social sharing by specifying og:description meta
  for blogpost, category, person, program and organization.

### Changed

- Include new pages in navigation by default so they have a breadcrumb
- Create a generic React Modal component
- Create an context util
- Add react-query to manage API requests and local data store
- Move type utils into type directory
- Make licenses on course page optional

### Fixed

- Fix negative scores causing a 500 error for courses far in the future.
- Remove transparency when not necessary so that images are converted to jpg
- Prevent logout action to be called twice
- Fix og:image when using S3Boto3Storage
- Remove error message related with cache when any test fails

## [2.9.1] - 2021-11-03

### Fixed

- Improve handling for autocompletion missing query errors
- Stack organization logo to the right and behind category badget on
  course glimpse
- Fix rendering difference between React and Django course glimpses
- Hide enrollment count by default until an explicit minimum is set
- Fix an error when a user typed a short search query in the header or home

## [2.9.0] - 2021-10-27

### Added

- Add enrollment count to course run and to course page
- Add blocks on header and footer for branding overrides
- Add organization logo to course glimpse
- Add a signal to update the ES index when a category page is moved

### Fixed

- Fix an issue related to css selector priority from r-scheme-colors mixins
- Fix css classes related with course runs on the course detail page.

## Changed

- Update course search API to remove MPTT regexes as query params and replace
  them with arrays or strings.
- Use stable IDs for categories and organizations in ES indices and throughout
  all search-related code.

### Fixed

- Fix `useCache` hook when it has to encode UTF-16 characters to base 64.
- Fix an issue related to css selector priority from r-scheme-colors mixins
- Fix css classes related with course runs on the course detail page.
- Fix error on course page when course run doesn't have any title and the
  setting WEB_ANALYTICS_ID is enabled
- Fix organization str when organization code is null

## [2.8.2] - 2021-10-05

### Fixed

- Fix schema.org related "pt_effort" string computation when effort is not set
- Use `$r-course-subheader-aside` to define subheader aside column width
### Changed

- Add attributes to the Section plugin

## [2.8.1] - 2021-09-28

### Changed

- Set a proper default value to `DJANGO_SECRET_KEY` in `Base` configuration
- Update search filters to stop relying on CMS pages MPTT paths

### Fixed

- Remove use of `f-strings` within `gettext_lazy`
- Lazily retrieve elasticsearch server version
- Fix meta header "alternate" href value to avoid duplicates in search engine
- Fix search template meta block like missing favicon and open graph metas

## [2.8.0] - 2021-09-17

### Added

- Schema.org structured data markup for course detail pages
- Course code information on the course glimpse
- Course introduction and code to the search index and API
- Documentation on connecting Richie with OpenEdX
- Add robots.txt template with a sitemap rule so it is no longer needed
  to register the sitemap.xml URL from each crawler administration panel
- Add a new web analytics feature with support for Google Analytics by default
- Richie is now compatible with both ES6 and ES7

### Changed

- Increase blogpost excerpt size limit to 240 characters
- Change organization icon on course glimpse to a building
- Boost course title field by a factor of 20 (empirical) for fulltext queries
- Sort related blogposts by their publication date (latest comes first)
- Upgrade to DjangoCMS 3.9.0 (and subsequently to Django 3.2.6)

### Fixed

- Fix course teaser layout issues on Safari
- Fix html landmarks for screen readers
- Fix link to homepage should have a default title for context
- Escape FRONTEND_CONTEXT characters for use in Javascript string
- Reverse 401 and 403 errors in course run synchronization webhook
- Fix missing persons search index update on publish/unpublish
- Delete object from search indices when its page is unpublished
- Fix section on blogpost detail page which was breaking the flow for children
- Hide unpublished pages when getting related objects on a public page
- Fix course and organization code fields normalization and validation
- Fix search bug due to wrong ordering of char filters
- Stop indexing unpublished categories
- Repatriate within our codebase the deprecated bootstrap mixin
  make-container-max-widths
- Fix course teaser layout issues on Safari

## [2.7.1] - 2021-06-08

### Fixed

- Stop sending username in LTI consumer requests as it breaks the signature

## [2.7.0] - 2021-06-04

### Added

- Add "hreflang" meta to all pages to avoid duplicates in search engines

### Changed

- Send username to LTI Consumer if user is logged in
- Make related courses optional for program page

### Fixed

- Fix permissions on the LTI consumer plugin when granting instructor role
- Allow configuring the inline ratio and auto-resizing for manually-defined
  LTIConsumerPlugin instances
- Use a unique name to LTIConsumerPlugin iframes to allow several plugins on the
- Fix iframeResizer on LTIConsumer component when several plugins are on the
  same page

## [2.6.0] - 2021-05-03

### Added

- Add a new authentication backend `fonzie`

### Changed

- Pin bootstrap to version below 5 to keep support of IE11

### Fixed

- Decrease LTI context API endpoint cache lifetime to 5 minutes

## [2.5.0] - 2021-04-21

### Added

- Add support for language fallback on "get_related_blogposts"
- Add portuguese translations

### Fixed

- Avoid KeyError when an object is indexed with no titles
- Add missing rel noopener noreferer on target blank links
- Order blogposts by descending publication date within
  (person|category)_detail template
- Fix filter pane quality issues on handheld devices
- Fix small quality issues on the course search filters modal
- Fix initializeAccordions compatibility issue

### Changed

- Clean built frontend files before each build
- Remove use of regexp group for JS_COURSE_REGEX setting

## [2.4.0] - 2021-04-07

### Added

- Add support for language fallback on search indexes
- Add support for language fallback to get page extensions directly and
  reversely related to a page via a plugin

### Changed

- On draft pages, show page extension plugins targeting draft pages
- Retrieve LTI Consumer plugin context through an API endpoint

### Fixed

- Pin Django to versions less than 3.2 which is not compatible with DjangoCMS
- Fix pace computation when it is under an hour

### Removed

- Creation date displayed on program glimpses

## [2.3.3] - 2021-03-25

### Fixed

- Fix page extension plugins string representation

## [2.3.2] - 2021-03-25

### Fixed

- Fix layout issue on LTI consumer resizing

### Added

- Allow fullscreen within LTI consumer iframe

## [2.3.1] - 2021-03-24

### Fixed

- Fix course enrollment execution stack timing issue

## [2.3.0] - 2021-03-23

### Changed

- Cache getting the course runs dictionary from the course model
- Take fallback languages into account in page extension plugins
- Load components lazily in Root component

### Fixed

- Fix LTI consumer plugin (edit mode, manual config and update after create)
- Fix an issue about text selection on search input on Firefox

## [2.2.0] - 2021-03-05

### Added

- Take into account fulltext search score for sorting
- Add new state for courses archived yet open for enrollment and position them
  well in search results
- Add a banner component to display brief messages to the user
- Add `is_self_paced` boolean field to course model
- Add pace and duration icons.
- Add `get_pace` and `get_pace_display` methods to course model
- Add new plugin "LTI consumer" to include LTI provided content.
- Add `COURSE_RUN_SYNC_NO_UPDATE_FIELDS` setting into `RICHIE_LMS_BACKENDS`

### Changed

- Change type of `effort` course field
  from `EffortField` to `CompositeDurationField`
- Order blog posts by their publication date on the blog post list view
- Removed SimplePicturePlugin in course_teaser placeholder
- In course_teaser placeholder, image from course_cover placeholder is used
  if no video is present

### Fixed

- Prevent a 500 error when an editor uses a template for a page
  that requires to have a model attached as a page extension
  (course, person, organization and category detail templates)
- Fix autosuggest to redirect user directly on the course page when a course
  entry has been selected from the suggestion dropdown
- Pin `django-treebeard` to `4.4` as the 4.5 release introduces BC
- Code update to support arrow 1.0

## [2.1.0] - 2021-01-22

### Added

- Add a "person" variant to the glimpse plugin for persons without a page
- Allow person and glimpse plugins on the person detail page
- Allow overriding a person's bio on the person plugin
- Add new section on the course detail page to display related programs
- Display "code" on the course detail page and allow frontend editing
- Add dashboard link to user menu
- Use dashboard link if enrolled lms course hasn't started yet

### Changed

- Mock error handler on frontend tests
- Show 403 page instead of course run list when trying to edit a course run
  with insufficient permissions
- Improve UX of course search pagination by avoiding truncation of page number
  when it is not relevant
- Hide "Go to course" button if lms course hasn't started yet
- Add Urls `key` property in profile_url settings

### Fixed

- Fix course pages subtree following removal of course run pages
- Fix HTMLSiteMap plugin when placed in a static placeholder
- Fix HTMLSiteMap plugin when `current_page` property context is not defined
- Delete template `course_run_detail.html` was still referenced in settings
- Fix unwanted comma when displaying course runs list on course detail page

## [2.0.1] - 2021-01-11

### Fixed

- Deprecate `JS_SELECTOR_REGEXP`

## [2.0.0] - 2021-01-11

### Changed

- Migrate factories to factory_boy 3.2.0
- Spread body-content block if document content height is smaller than
  the window height
- Remove a xhr request by passing course run information to the
  CourseRunEnrollment widget via data-props
- Make the course run "title" field optional
- Replace deprecated xlink:href svg attribute by href
- Update and include the latest version of translations
- Bump `docs` to version 2.0.0

### Added

- Add an API endpoint to synchronize course runs from e.g. an external LMS
- Add a "code" field on the course model to allow reference & synchronization
- Use custom views to handle errors (400, 403, 404, 500)

### Fixed

- Fix Sentry SDK initialization environment and release parameters
- intl-relativetimeformat polyfill did not use the right locale filename
  when locale was composed of a languageCode identical to countryCode
- Make generate demo site work when the default language is set to "fr"
- Add permission checks to course run admin based on their related course page
- Fix image srcset in organization_detail template

## [2.0.0-beta.22] - 2020-12-04

### Changed

- Refactor course runs to not be CMS pages anymore

### Fixed

- Stop indexing snapshots on signal update
- Fix object names plurals in admin

## [2.0.0-beta.21] - 2020-11-27

### Added

- Add a frontend API Implementation for OpenEdX Dogwood/Eucalyptus
- Add a new variant "Badge" to glimpse plugin

### Changed

- Improve the layout of the footer to save space
- Allow ProgramPlugin in SectionPlugin on Homepage
- Allow only one CKEditorPlugin to program_body placeholder

### Fixed

- Fix an issue about PaginateSearchCourse layout
- Prevent enrollment failure if course run's resource_link does not match the
  course regexp

## [2.0.0-beta.20] - 2020-11-10

### Added

- Add a large variant for course glimpses

### Fixed

- Fix maincontent placeholder on person detail page when empty

## [2.0.0-beta.19] - 2020-11-09

### Added

- Add a color palette for selector component
- Add a color palette for spinner component

### Fixed

- Fix a typo in base template

## [2.0.0-beta.18] - 2020-11-06

### Fixed

- Support case when AUTHENTICATION_DELEGATION is not defined
- Fix a bug on create_demo_site.py when LMS_BACKENDS is not defined
- Fix a style issue related to buttons in topbar

## [2.0.0-beta.17] - 2020-11-03

### Added

- Add a flag allowing to exclude some courses from the search index and page
- Allow use of columns in footer menu items
- Use Limited CKEditor to edit section title

### Changed

- Upgrade to DjangoCMS 3.8.0 (and subsequently to Django 3.1.2)
- Remove react-intl-po
- Rework front i18n workflow

### Fixed

- Reinitialize JS after saving a modification in edit mode
- has_connected_lms crashed when course_run is blank
- Avoid stretching of footer menu items

## [2.0.0-beta.16] - 2020-10-23

### Fixed

- Hide unpublished pages from public version of organizations list page
- Improve sanitizing of input text on CKEditor plugin
- Replace course-detail__run-cta in fragment_course_run template by
  course-run-enrollment__cta

### Changed

- Add AUTHENTICATION_DELEGATION setting
- Refactor the optional LMS connector to focus on OpenEdX and use its session
  directly through CORS requests from the frontend.
- Delegate course run enrollment logic to frontend.

## [2.0.0-beta.15] - 2020-10-06

### Added

- Add main content placeholder to programs list view
- Create a function checking username in social auth pipeline
- Extend social-auth middleware to use a page to display error
- Add `urls` property to `UserSerializer`. The urls are built with a new setting
  `MAIN_LMS_USER_URLS` which contains custom links to access to LMS profile
  views from richie.
- Add a useMatchMedia hook to easily show/hide react component
  through media query
- Add LimitBrowserCacheTTLHeaders middleware to limit the browser cache TTL

### Changed

- Allow default CKEditor settings on "maincontent" placeholders
- Remove copyright notice from footer in base template and allow customizing it
- Allow customizing the side pages created by the demo site
- Make demo site work without licences placeholder
- Allow empty content on glimpse plugins
- Switch from deprecated tslint to eslint js linter and update codebase
  accordingly.
- Improve Course Search UX by triggering scroll up after courses are retrieved

### Fixed

- Frontend did not report error to Sentry
- Fix how EDX_USER_PROFILE_TO_DJANGO default value is set
- Use variables for button colors in language selector so it fits in
  with themes.

## [2.0.0-beta.14] - 2020-09-03

### Changed

- Change CTA enrollment button for anonymous users
- Allow to configure EDX_USER_PROFILE_TO_DJANGO setting

### Fixed

- Limit number of text plugins to 1 in the course description placeholder

## [2.0.0-beta.13] - 2020-08-27

### Added

- Add a language picker menu to Richie's header & footer, powered by a new
  React component.

## [2.0.0-beta.12] - 2020-08-27

### Added

- Add LMS connection (back and front) to handle enrollment on course runs
- Add LMS backend with enrollment methods for Open edX

### Changed

- Allow any format for course run urls
- Stop synchronizing user permission fields on oauth: `is_staff` and
  `is_superuser`
- Add default image for empty person portrait
- Add default images for empty organization logo and banner
- Add translation context to course and course run detail page section titles

### Fixed

- Authentication urls should not be i18n
- Reorder sections on the course run detail page to mirror course detail page

## [2.0.0-beta.11] - 2020-08-17

### Fixed

- Fix typo in python dev dependencies

## [2.0.0-beta.10] - 2020-08-17

### Added

- Add Linkedin badge in social networks templates.
- Add new section "septenary" with a new wave decoration.
- Add redis sentinel cache backend
- Allow to configure cache and session settings with environment variables

### Changed

- Allow one simple text plugin as person page main content
- Allow glimpse plugins in course page information placeholder
- Revert to long plugin names in side toolbar placeholder plugin list

### Fixed

- Spinner component was broken due to missing styles.

## [2.0.0-beta.9] - 2020-07-01

### Added

- Add oauth2 and OIDC authentication backends for SSO with Open edX
- Add an icon to the 'login' button.
- Add icons in course glimpse footer & next to organization name.
- Add new variant "quote" to glimpse plugin.

### Changed

- Improve search error message layout
- Make larger thumbnail for course and blogpost glimpses.

### Fixed

- Lowered down global 'h1' and 'h2' font size and added new
  'extra-font-size' variable with previous h1 value.
- Adjust title size 'large_banner' variants.
- Fix accordion button 'nested-item__title' alignment to the left.
- Another attempt to definitively fix the glitch with wave decoration
  and Chrome zoom/unzoom.
- Add a little bit of space between banner and title on organization
  and category detail.
- Fix header menus align/position between breakpoint 'md' end and
  'lg' start.
- Fix breadcrumb item on small breakpoints when text is too long.
- Fix nesteditem list variant to act like a basic list.
- Fix an issue that broke the course search field after the user clicked
  the "reset filters" helper.

## [2.0.0-beta.8] - 2020-06-17

### Added

- Bind terms and conditions url into frontend context and use it in sale tunnel
- Add checkmark icon to course skills bullet lists.

### Changed

- Change course detail content titles to neutral dark color.
- Customize CMS placeholder menu for more readability.
- Make login/logout CTA more visible.
- Add template block around footer slogan.

### Fixed

- Fix course detail vertical rhythm and font size.
- Fix accordion border line.
- Fix basic block element alignment in section.
- Include the SVG icons sprite in `base.html` instead of loading it as
  external content so it can support usage with CDNs.
- Add grid constraint on person 'main_content' placeholder content.
- Make course glimpse category cartouche less "aggressive".
- Improve accessibility on 'body-mentions'

## [2.0.0-beta.7] - 2020-06-08

### Changed

- Allow glimpse plugin in course information placeholder
- Allow overriding the contact us button in the topbar
- Improve performance of Search frontend.
- Refine Large banner plugin layout for hero variant.
- First course glimpses on three columns on homepage.
- Fix glitch with "scaleX" usage on wave decoration on category and
  organization detail banner.
- Fix content vertical alignment for category glimpses in section
  tiles.

## [2.0.0-beta.6] - 2020-05-19

### Added

- New integration for nested items and glimpse plugins
- Add glimpse plugins to the course information placeholder on demo site

### Changed

- Refactor nested items to simplify them
- Remove the "suggested by" sentence from course detail view
- Allow overriding the contact us button in a theme
- Center organizations on course detail view
- Scroll course search to top when the user interacts with the filters pane.
- Increase default course search results number from 20 to 21.

### Fixed

- Invert course description and introduction blocks

## [2.0.0-beta.5] - 2020-05-04

### Fixed

- Fix an issue where analyzing course search queries with irrelevant analyzers
  caused very low relevance results in course search.

### Changed

- New Program glimpse layout.
- A lot of minor fixes and changes in Sass sources.

## [2.0.0-beta.4] - 2020-04-20

### Fixed

- Custom fixtures directory setting should point to the "fixtures" directory

## [2.0.0-beta.3] - 2020-04-19

### Added

- Allow defining custom image fixtures on demo site,
- Allow configuring a custom domain on demo site.

## [2.0.0-beta.2] - 2020-04-17

### Added

- Add blocks to each part of the blogpost detail template.

### Changed

- Enforce course glimpse footer to be on a single line.

### Fixed

- Liquidate pending migrations in view of the v2.0.0 release
- Fix section migration 0005 that was depending on NestedItem initial
  migration.
- Limit the number of related objects appearing on all types of detail pages.

## [2.0.0-beta.1] - 2020-04-16

### Fixed

- Add missing favicon static files to MANIFEST.in

## [2.0.0-beta.0] - 2020-04-15

### Added

- Add new plugin "Glimpse" to include some basic content with some variant
  form factor available.
- Add new plugin "NestedItem" to implement structured nestable and foldable
  content items.
- Add Styleguide view only available on `/styleguide/` in debug mode.
- Add full favicon set to cover every usages (browser, mobile app, etc..).

### Changed

- Major templates/css refactor to bring a complete new design for the demo.

### Removed

- The `section_cadenced` and `section_list` templates from the section plugin.

## [1.17.0] - 2020-04-15

### Added

- Add a variant option for blogpost glimpses,
- Add a method to retrieve the list of blogposts related to (ie that
  share at least one category with) another blogpost.
- Licences (through their "name" and "content" fields) are now translatable.
- Report frontend errors through Sentry when a sentry DSN is available in
  Django settings.
- ElasticSearch index name prefix (currently `richie_`) is now customizable
  through the settings.

### Fixed

- Refactor our template tags related to placeholders to fix ghost placeholders
- Prevent unintentionally creating duplicate permissions programmatically
- Fix an issue that crashed `regenerate_indexes` (and therefore
  `bootstrap_elasticsearch`) from a broken state in ES.
- `<Search />` component handles errors in course search requests, displaying
  an error message to end users.
- Make sure the course search API shows the 1st related organization by
  placeholder position as highlighted organization for a course instead of
  the first organization by node path.
- Fix an issue in Course Search that removed existing filters in some cases
  when using full text search.
- Properly clear the search input when using the "clear fields" button on the
  course search view.
- Prevent search view errors when the search query is 3 or more characters
  long, but 2 or less when whitespace is trimmed from both ends.

### Changed

- Improve plugin description displayed in side toolbar.
- Improve ElasticSearch `regenerate_indexes` tests.
- Improve breadcrumb on course run page by creating a specific version.

## [1.16.2] - 2019-12-18

### Fixed

- Fixed an issue with Picture instances that did not contain an image.

## [1.16.1] - 2019-12-13

### Changed

- Allow CKEditor with minimal options on course format, prerequisites and
  assessment sections.

## [1.16.0] - 2019-12-10

### Added

- Display all categories related to blogposts on the News page,
- Add Cypress-based end-to-end tests that check accessibility with axe.

### Changed

- Rename all occurences of the "form_factor" variable to "variant",
- Restructure categories glimpse/plugin for modularity and harmonization,
- Update the frontend build to supported outdated browsers such as IE11.
- Segment course runs according to status on course detail page,
- Our course search fields now have a "Search" button with a magnifying
  glass icon.

### Fixed

- Make placeholders work on a page created with PageFactory by rescanning
  placeholders,
- Improve responsiveness of footer logos and person categories that were not
  folding properly,
- Pin Django to version less than 3.0.

## [1.15.0] - 2019-12-02

### Changed

- Hide unpublished blog posts from the news page,
- Display publication date instead of creation date on blog posts,
- `<Search />` no longer includes the search bar and page title. Those are
  expected to be included in the Django template. The rationale for this
  change is to give users more freedom with their DOM & page structure.

## [1.14.1] - 2019-11-23

### Fixed

- Add missing migration dependency to avoid IntegrityError on live databases.

## [1.14.0] - 2019-11-23

### Added

- Add a template to the section plugin to allow rendering unordered list,
- Add an API endpoint to get static versions of the filter definitions.

### Changed

- Frontend components now use `<html lang>` to pick up the locale instead
  of expecting a `data-locale` attribute.
- Refactor the footer to use a static placeholder instead of the page tree:
  - allow organizing footer links in columns or as flat links,
  - allow customizing footer links (e.g. by setting the link target)
  - allow adding any internal or external link to the footer,
  - decorrelate the structure of footer links from the page tree.
- Make the section plugin title optional,
- Change the way frontend search field components are configured.

### Fixed

- Main organization after an ordering clause was inadvertently commented,
- The language chooser should only show public languages,
- The language chooser shouldn't render an empty <ul> on sites with 1 language.

## [1.13.0] - 2019-11-15

### Added

- Add an Ajax toolbar menu item to regenerate the search index,
- Add a React-powered component to handle login/signup and user status in
  the base template.

### Changed

- Remove the "Exo 2" font from Richie. Use system `sans-serif` instead.
- Rename the `fun-react` class used to Django-React interop to `richie-react`.
- Improve documentation on Django-React interop.

### Fixed

- Fix undefined behavior on hits on the categories API from unrelated requests,
  return 404 errors instead.
- Improve React spinner component accessibility.
- Repair broken link titles for the language picker menu.

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
  docker compose configuration for testing either with MySQL or PostgreSQL
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
- Debounce search requests

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

[unreleased]: https://github.com/openfun/richie/compare/v2.28.1...master
[2.28.1]: https://github.com/openfun/richie/compare/v2.28.0...v2.28.1
[2.28.0]: https://github.com/openfun/richie/compare/v2.27.0...v2.28.0
[2.27.0]: https://github.com/openfun/richie/compare/v2.26.0...v2.27.0
[2.26.0]: https://github.com/openfun/richie/compare/v2.25.1...v2.26.0
[2.25.1]: https://github.com/openfun/richie/compare/v2.25.0...v2.25.1
[2.25.0]: https://github.com/openfun/richie/compare/v2.25.0-beta.1...v2.25.0
[2.25.0-beta.1]: https://github.com/openfun/richie/compare/v2.25.0-beta.0...v2.25.0-beta.1
[2.25.0-beta.0]: https://github.com/openfun/richie/compare/v2.24.1...v2.25.0-beta.0
[2.24.1]: https://github.com/openfun/richie/compare/v2.24.0...v2.24.1
[2.24.0]: https://github.com/openfun/richie/compare/v2.23.0...v2.24.0
[2.23.0]: https://github.com/openfun/richie/compare/v2.22.0...v2.23.0
[2.22.0]: https://github.com/openfun/richie/compare/v2.21.1...v2.22.0
[2.21.1]: https://github.com/openfun/richie/compare/v2.21.0...v2.21.1
[2.21.0]: https://github.com/openfun/richie/compare/v2.20.1...v2.21.0
[2.20.1]: https://github.com/openfun/richie/compare/v2.20.0...v2.20.1
[2.20.0]: https://github.com/openfun/richie/compare/v2.19.0...v2.20.0
[2.19.0]: https://github.com/openfun/richie/compare/v2.18.0...v2.19.0
[2.18.0]: https://github.com/openfun/richie/compare/v2.17.0...v2.18.0
[2.17.0]: https://github.com/openfun/richie/compare/v2.16.0...v2.17.0
[2.16.0]: https://github.com/openfun/richie/compare/v2.15.1...v2.16.0
[2.15.1]: https://github.com/openfun/richie/compare/v2.15.0...v2.15.1
[2.15.0]: https://github.com/openfun/richie/compare/v2.14.1...v2.15.0
[2.14.1]: https://github.com/openfun/richie/compare/v2.14.0...v2.14.1
[2.14.0]: https://github.com/openfun/richie/compare/v2.13.0...v2.14.0
[2.13.0]: https://github.com/openfun/richie/compare/v2.12.0...v2.13.0
[2.12.0]: https://github.com/openfun/richie/compare/v2.11.0...v2.12.0
[2.11.0]: https://github.com/openfun/richie/compare/v2.10.0...v2.11.0
[2.10.0]: https://github.com/openfun/richie/compare/v2.9.1...v2.10.0
[2.9.1]: https://github.com/openfun/richie/compare/v2.9.0...v2.9.1
[2.9.0]: https://github.com/openfun/richie/compare/v2.8.2...v2.9.0
[2.8.2]: https://github.com/openfun/richie/compare/v2.8.1...v2.8.2
[2.8.1]: https://github.com/openfun/richie/compare/v2.8.0...v2.8.1
[2.8.0]: https://github.com/openfun/richie/compare/v2.7.1...v2.8.0
[2.7.1]: https://github.com/openfun/richie/compare/v2.7.0...v2.7.1
[2.7.0]: https://github.com/openfun/richie/compare/v2.6.0...v2.7.0
[2.6.0]: https://github.com/openfun/richie/compare/v2.5.0...v2.6.0
[2.5.0]: https://github.com/openfun/richie/compare/v2.4.0...v2.5.0
[2.4.0]: https://github.com/openfun/richie/compare/v2.3.3...v2.4.0
[2.3.3]: https://github.com/openfun/richie/compare/v2.3.2...v2.3.3
[2.3.2]: https://github.com/openfun/richie/compare/v2.3.1...v2.3.2
[2.3.1]: https://github.com/openfun/richie/compare/v2.3.0...v2.3.1
[2.3.0]: https://github.com/openfun/richie/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/openfun/richie/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/openfun/richie/compare/v2.0.1...v2.1.0
[2.0.1]: https://github.com/openfun/richie/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/openfun/richie/compare/v2.0.0-beta.22...v2.0.0
[2.0.0-beta.22]: https://github.com/openfun/richie/compare/v2.0.0-beta.21...v2.0.0-beta.22
[2.0.0-beta.21]: https://github.com/openfun/richie/compare/v2.0.0-beta.20...v2.0.0-beta.21
[2.0.0-beta.20]: https://github.com/openfun/richie/compare/v2.0.0-beta.19...v2.0.0-beta.20
[2.0.0-beta.19]: https://github.com/openfun/richie/compare/v2.0.0-beta.18...v2.0.0-beta.19
[2.0.0-beta.18]: https://github.com/openfun/richie/compare/v2.0.0-beta.17...v2.0.0-beta.18
[2.0.0-beta.17]: https://github.com/openfun/richie/compare/v2.0.0-beta.16...v2.0.0-beta.17
[2.0.0-beta.16]: https://github.com/openfun/richie/compare/v2.0.0-beta.15...v2.0.0-beta.16
[2.0.0-beta.15]: https://github.com/openfun/richie/compare/v2.0.0-beta.14...v2.0.0-beta.15
[2.0.0-beta.14]: https://github.com/openfun/richie/compare/v2.0.0-beta.13...v2.0.0-beta.14
[2.0.0-beta.13]: https://github.com/openfun/richie/compare/v2.0.0-beta.12...v2.0.0-beta.13
[2.0.0-beta.12]: https://github.com/openfun/richie/compare/v2.0.0-beta.11...v2.0.0-beta.12
[2.0.0-beta.11]: https://github.com/openfun/richie/compare/v2.0.0-beta.10...v2.0.0-beta.11
[2.0.0-beta.10]: https://github.com/openfun/richie/compare/v2.0.0-beta.9...v2.0.0-beta.10
[2.0.0-beta.9]: https://github.com/openfun/richie/compare/v2.0.0-beta.8...v2.0.0-beta.9
[2.0.0-beta.8]: https://github.com/openfun/richie/compare/v2.0.0-beta.7...v2.0.0-beta.8
[2.0.0-beta.7]: https://github.com/openfun/richie/compare/v2.0.0-beta.6...v2.0.0-beta.7
[2.0.0-beta.6]: https://github.com/openfun/richie/compare/v2.0.0-beta.5...v2.0.0-beta.6
[2.0.0-beta.5]: https://github.com/openfun/richie/compare/v2.0.0-beta.4...v2.0.0-beta.5
[2.0.0-beta.4]: https://github.com/openfun/richie/compare/v2.0.0-beta.3...v2.0.0-beta.4
[2.0.0-beta.3]: https://github.com/openfun/richie/compare/v2.0.0-beta.2...v2.0.0-beta.3
[2.0.0-beta.2]: https://github.com/openfun/richie/compare/v2.0.0-beta.1...v2.0.0-beta.2
[2.0.0-beta.1]: https://github.com/openfun/richie/compare/v2.0.0-beta.0...v2.0.0-beta.1
[2.0.0-beta.0]: https://github.com/openfun/richie/compare/v1.17.0...v2.0.0-beta.0
[1.17.0]: https://github.com/openfun/richie/compare/v1.16.2...v1.17.0
[1.16.2]: https://github.com/openfun/richie/compare/v1.16.1...v1.16.2
[1.16.1]: https://github.com/openfun/richie/compare/v1.16.0...v1.16.1
[1.16.0]: https://github.com/openfun/richie/compare/v1.15.0...v1.16.0
[1.15.0]: https://github.com/openfun/richie/compare/v1.14.1...v1.15.0
[1.14.1]: https://github.com/openfun/richie/compare/v1.14.0...v1.14.1
[1.14.0]: https://github.com/openfun/richie/compare/v1.13.0...v1.14.0
[1.13.0]: https://github.com/openfun/richie/compare/v1.12.1...v1.13.0
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
