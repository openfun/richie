# Upgrade

All instructions to upgrade this project from one release to the next will be
documented in this file. Upgrades must be run sequentially, meaning you should
not skip minor/major releases while upgrading (fix releases can be skipped).

The format is inspired from [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Before any upgrade, collect static files and run database migrations:

```bash
$ make collectstatic
$ make migrate
```

## Unreleased


- We upgrade our frontend to React 19, you have to update your dependencies
  and overriden components accordingly.
- Added the new setting `RICHIE_DEFAULT_COURSE_RUN_PRICE_CURRENCY` which is used to offer prices (courses price and certificate prices).
```
  RICHIE_DEFAULT_COURSE_RUN_PRICE_CURRENCY = values.Value(
      "EUR",
      environ_name="RICHIE_DEFAULT_COURSE_RUN_PRICE_CURRENCY",
      environ_prefix=None,
  )
```
## 2.33.0 to 2.34.0

- Header menu template has been modified to include features from `MainMenuEntry`
- There is a new setting that can be used to define a list of color variant for the menu
  entry of a page:

  ```
  RICHIE_MENU_ENTRY_COLOR_CLASSES = (
      ("", _("None")),
      ("red", _("Red")),
  )
  ```

  Selected choice value will be used as a variant name in a classname prefixed with
  `topbar__item--`, so here for the *Red* it would be `topbar__item--red`. However it
  depends from your menu template.

- There is a new setting that defines if admin can create a new PageIndex extension
  for a page:

  ```
  RICHIE_MAINMENUENTRY_ALLOW_CREATION = False
  ```

  When migrating to this release you would probably to turn it on until you added the
  extension to your main pages then it turn it off

- There is a new setting that defines the allowed page level that can hold
  a PageIndex extension:

  ```
  RICHIE_MAINMENUENTRY_MENU_ALLOWED_LEVEL = 0
  ```

  Other page levels won't be allowed to create a PageIndex extension. Commonly it would
  be `0` for when your main menu list the root pages.

- After the change to the `base.html` template, you will now need to add the
  `branding_topbar_logo` block to the `branding_topbar` block to have the same functionality.
  If this remains the same in any site on your site factory, the `Go to homepage` link won't be
  available.

## 2.31.0 to 2.33.0

- Add new `slider` plugin theme scheme:
  ```scss
  slider-plugin: (
    arrows-color: r-color('firebrick6'),
    arrows-hover-color: r-color('firebrick6'),
    index-color: r-color('firebrick6'),
    index-hover-color: r-color('firebrick6'),
  ),
  ```

- There is a new Sass settings that can be used to define 'slider' content font properties:
  ```scss
  $r-slider-title-fontsize: $h1-font-size;
  $r-slider-title-fontweight: $font-weight-bold;
  $r-slider-title-fontfamily: $headings-font-family;
  $r-slider-content-fontsize: $h4-font-size;
  $r-slider-content-line-height: 1.1;
  ```
  These are the default component values but you may customize them if needed.

## 2.30.0 to 2.31.0

- There is a new Sass settings that can be used to define 'simple-text' box properties:
  ```scss
  $r-simpletext-margin-bottom: 0.5rem;
  $r-simpletext-variant-padding: 1rem;
  $r-simpletext-variant-radius: 0.75rem;
  ```
  These are the default component values but you may customize them if needed.

- Add new `simpletext-variant-box` theme scheme:
  ```scss
  simpletext-variant-box: (
    primary-color: r-color('denim'),
    secondary-color: r-color('white'),
  ),
  ```

- Add new `r-section-grid-sizes` variable
```
  $r-section-grid-sizes: (
    '50x50': 1fr 1fr,
    '33x33x33': 1fr 1fr 1fr,
    '25x75': 25% 2fr,
    '75x25': 2fr 25%,
  );
```
- Add new `r-section-grid-gutters` variable
```
  $r-section-grid-gutters: (
    'sm': 0.5rem,
    'xl': 1rem,
  );
```
- There is a new setting that can be used to define custom column sizes for Section
```
    RICHIE_SECTION_GRID_COLUMNS = [
        ("", _("None")),
        ("33x33x33", _("Three columns: (33% | 33% | 33%)")),
        ("50x50", _("Two columns: (50% | 50%)")),
        ("25x75", _("Two columns: (25% | 75%)")),
        ("75x25", _("Two columns: (75% | 25%)")),
    ]
```

## 2.25-beta.0 to 2.30.0

- Add new `compacted-banner` theme scheme
```
  compacted-banner: (
    title-color: r-color('charcoal'),
    title-alt-color: r-color('firebrick6'),
    content-color: r-color('black'),
    search-input-background: rgba(r-color('white'), 0.7),
    search-btn-background: r-color('firebrick6'),
    search-icon-fill: r-color('white'),
    cta-variant-from: rgba(r-color('white'), 0.8),
    cta-variant-to: rgba(r-color('white'), 0.8),
    cta-color: r-color('firebrick6'),
    cta-border: r-color('white'),
  ),
```

## 2.25-beta.0 to 2.26.0

- Dropped support for postgres version < 12
- Dropped support for MySQL version < 8
- Add new `dashboard-splitted-card` theme scheme
```
  dashboard-splitted-card: (
    color: r-color('charcoal'),
    base-shadow: 0 0 6px r-color('light-grey'),
    background-color: r-color('white'),
    dot-color: r-color('firebrick6'),
    separator-color: r-color('grey87')
  ),
```

## 2.24.1 to 2.25-beta.0

- `CourseProductItem` has been moved into `SyllabusCourseRunsList/components` folder. If you have
  overridden this component, you have to update your overrides.json file accordingly.
- `JOANIE_BACKEND` must be updated. `COURSE_REGEX` and `JS_COURSE_REGEX` must be updated to match
  new api routes. Take a look at [joanie connection documentation](/docs/joanie-connection.md) for
  more details.
- We now using Button components from cunningham design system. They can be customise with cunningham tokens
  configuration. See https://openfun.github.io/cunningham/?path=/docs/getting-started-customization--docs
- scss themes variable for SaleTunnel button have been removed. These are now cunningham buttons and can be
  customised using cunningham-tokens.
- scss themes variable for Modal 'close button' have been removed. It is now a cunningham button and can be
  customised using cunningham-tokens.
- cunningham have been upgraded to 2.0.0, you can follow it's upgrade guide here: https://openfun.github.io/cunningham/?path=/docs/migrating-from-v1-to-v2--docs
- With the migration to Cunningham Button, we have to reset some bootstrap styles, so we have to add a new
  `scss/trumps/_bootstrap.scss` file. You have to import it in your `_main.scss` file.
  ```scss
  // ...

  // Import bootstrap reset
  @import 'richie-education/scss/trumps/bootstrap';
  ```
- Delete richie Button component now that we use cunningham Button component.

## 2.23.0 to 2.24.1

- `*_detail.html` django templates have been updated to use new course-glimpse-list structure. If
  have overridden those templates, you must update them. (https://github.com/openfun/richie/pull/2069/commits/e36fa58a579c3b58384baf896fcf4b7579a46342)
- In `_theme.scss`, `steps-content` map has one more property `summary-hover-color`, if you have
  overriden this map, you must add this new property.

## 2.21.0 to 2.23.0

- Within course_detail template, course runs list is now rendered as a React widget. As consequence
  `fragment_course_run` and `fragment_course_runs_list` have been removed. If you have overridden
  those templates, you have now to override corresponding React widget (`SyllabusCourseRunsList`).
- `courses` app export new routes named `redirects_urlpatterns`. You have to add those new routes to
  the urls module of your app.
  ```python
  from richie.apps.courses.urls import redirects_urlpatterns as courses_redirects_urlpatterns

  urlpatterns += [
    re_path(r"^redirects/", include([*courses_redirects_urlpatterns])),
  ]
  ```
- Legacy colors are now defined in cunningham.cjs instead of palette.scss. You must import cunningham
  scss tokens in your _main.scss files above the override of colors/palette.
  ```scss
  // ...
  // Import Cunningham tokens and icons
  @import '@openfun/cunningham-react/dist/icons';
  @import '@openfun/cunningham-react/dist/style';
  @import 'richie-education/scss/vendors/cunningham-tokens';
  @import 'richie-education/scss/vendors/css/cunningham-tokens';

  // Override default Richie settings variables
  @import 'richie-education/scss/colors/palette';
  // ...
  ```
  `yarn build-theme` command generates tokens files `scss/vendors/cunningham-tokens.scss` and
  `scss/vendors/css/cunningham-tokens.css`. `$palette` variable is now deprecated and will be
  removed in the next major release. Currently this is only an alias to the
  `map.get($theme, colors)` ($theme is a sass variable exported by `cunninghtam-tokens.scss`).
- Components `CourseGlimpse` and `CourseGlimpseList` has been moved from `js/widgets/Search` folder to
  `js/components` folder. Update your overrides.json and path in your custom scss files accordingly.
- `js/utils/test/factories.ts` have been split into multiple files: joanie.ts, richie.ts and
  reactQuery.ts. Update your import accordingly.

## 2.20.1 to 2.21.0

- Frontend folder architecture has been totally reworked. If you have overridden
  any frontend components, you should have to update your overrides.json file to match new paths. In
  the same way, you should also check sass import paths in your custom scss files.
- The web analytics settings have been changed, from multiple settings to a single `WEB_ANALYTICS`
  dict setting. The dict `key` is the web analytics identification string and the `value` is
  a dict with specific configuration for each web analytics solution.
  Nevertheless the shared `tracking_id` and `location` keys are shared between all web analytics
  providers.
  If you extends the web analytics js code with your own solution, you should be careful,
  because the code has been changed to support multiple web analytics providers to be activated
  at the same time.
  For performance reasons the default location for the web analytics js code
  have been changed from `head` to `footer`.
  So you should change the `WEB_ANALYTICS` setting in your settings.py file:
  ```python
  WEB_ANALYTICS = values.DictValue(
      None,
      environ_name="WEB_ANALYTICS",
      environ_prefix=None,
  )
  ```
  The old behavior can still be enabled if you use the next value on the `WEB_ANALYTICS`
  setting and replace the `UA-TRACKING_ID` value with your own value of the removed
  `WEB_ANALYTICS_ID` setting.
  ```
  {
      'google_universal_analytics': {
          'tracking_id': 'UA-TRACKING_ID',
          'location': 'head,
      },
  }
  ```

## 2.19.x to 2.20.1

- A new setting "FEATURES" has been added to enable some early features. If you want to test those
  features you have to add this setting in your settings.py file:
  ```python
  # Feature flags
  FEATURES = values.DictValue(environ_name="FEATURES", environ_prefix=None)
  ```

## 2.18.x to 2.19.x

- In `_theme.scss`, `course-detail` scheme now accepts two new optional properties to style
  the course run CTA and feedback color in the course detail subheader:
  - `subheader-run-cta`
  - `subheader-run-feedback-color`

  If those values are not set, the default values are respectively `run-cta` and
  `run-feedback-color properties.

## 2.17.x to 2.18.x

- To manage Joanie's products and course runs, the settings `JOANIE_BACKEND` has to be bound
  into `RICHIE_LMS_BACKENDS`. To bind those settings add this code within `post_setup` method
  of `Base` class configuration within `settings.py`.
  ```python
    @classmethod
    def post_setup(cls):
        ...
        # If a Joanie Backend has been configured, we add it into LMS_BACKENDS dict
        if cls.JOANIE_BACKEND.get("BASE_URL") is not None:
            cls.RICHIE_LMS_BACKENDS.append(cls.JOANIE_BACKEND)
  ```

## 2.16.x to 2.17.x

- Richie is now able to delegate course enrollment to Joanie which will then synchronize its
  course runs with Richie and provide advanced enrollment, ecommerce and multi-LMS features.
  To set up this feature, you can add to `JOANIE_BACKEND` setting the following properties:
  ```python
  JOANIE_BACKEND = {
    # ...
    "BACKEND": "richie.apps.courses.lms.joanie.JoanieBackend",
    "JS_BACKEND": "joanie",
    # The regex to match a resource that can be handle by the lms.joanie.JoanieBackend interface
    "COURSE_REGEX": r"^.*/api/v1.0/(?P<resource_type>(course-runs|products))/(?P<resource_id>[^/]*)/?$",
    # The regex to match a resource that can be handle by the lms.joanie.JoanieBackend interface
    "JS_COURSE_REGEX": r"^.*/api/v1.0/(course-runs|products)/([^/]*)/?$",
    # A list of course run properties to not update
    "COURSE_RUN_SYNC_NO_UPDATE_FIELDS": [],
    # The synchronization mode ("manual", "sync_to_public" or "sync_to_draft")
    "DEFAULT_COURSE_RUN_SYNC_MODE": "sync_to_public",
  }
  ```

## 2.15.x to 2.16.x

- The way filters are configured has changed. There is now a separate setting
  `RICHIE_FILTERS_PRESENTATION` to easily define which filters are displayed and in which order.
  If you need to customize more than the list and order of the search filters, the
  `RICHIE_FILTERS_CONFIGURATION` still exists and has a new simplified format.

## 2.14.x to 2.15.x

- On frontend, the API interface `base` has been renamed into `dummy`.
- `<header>`, `<nav>` and `<footer>` DOM structure was updated for better accessibility. Make
  sure to check that everything still renders correctly if you override header or footer blocks
  in your templates.
- The `_main.scss` file has been refactored, to made future upgrades more easy. The file
  `_main.scss` can be more compact with lower probability of changes on future upgrades.
  Use the [cookiecutter](cookiecutter/{{cookiecutter.organization}}-richie-site-factory/template/{{cookiecutter.site}}/src/frontend/scss/_main.scss) `_main.scss` file as example.
- RegisteredAddress now has a related stylesheet, you have to update the main stylesheet as follows:
  - `_main.scss`
  ```diff
  +   @import 'richie-education/js/components/RegisteredAddress/styles';
  ```
  - Only if you have overridden `_theme.scss`:
  ```diff
  ...
  +sale-tunnel: (
  +  primary-button-scheme: $firebrick6-scheme,
  +  primary-button-is-outlined: false,
  +  secondary-button-scheme: $purplish-grey-scheme,
  +  secondary-button-is-outlined: true,
  +  tertiary-button-scheme: $smoke-scheme,
  +  tertiary-button-is-outlined: false,
  +),
  ...
  ```
## 2.13.x to 2.14.x

- New frontend widgets has been added, you have to update stylesheets as follows:
  - `_main.scss`
  ```diff
  +   @import 'richie-education/scss/tools/utils';

  +   @import 'richie-education/js/components/AddressesManagement/styles';
  +   @import 'richie-education/js/components/CourseProductCertificateItem/styles';
  +   @import 'richie-education/js/components/CourseProductCourseRuns/styles';
  +   @import 'richie-education/js/components/CourseProductItem/styles';
  +   @import 'richie-education/js/components/PaymentButton/styles';
  +   @import 'richie-education/js/components/RegisteredCreditCard/styles';
  +   @import 'richie-education/js/components/SaleTunnel/styles';
  +   @import 'richie-education/js/components/SaleTunnelStepPayment/styles';
  +   @import 'richie-education/js/components/SaleTunnelStepResume/styles';
  +   @import 'richie-education/js/components/SaleTunnelStepValidation/styles';
  +   @import 'richie-education/js/components/StepBreadcrumb/styles';
  ...
  +   @import 'richie-education/scss/components/templates/richie/multiple-columns';
  ```

  - Only if you have overridden `_palette.scss`:
  ```diff
  $palette = {
    ...
  +   'mantis': #76ce68,
  }
  ```

  - Only if you have overridden `_theme.scss`:
  ```diff
  base-schemes: (
    ...
  +  active: $active-scheme,
  )
  ...
  +product-item: (
  +  base-background: r-color('white'),
  +  base-border: r-color('purplish-grey'),
  +  light-color: r-color('white'),
  +  base-color: r-color('charcoal'),
  +  lighter-color: r-color('battleship-grey'),
  +  button-color: r-color('white'),
  +  button-background: r-color('firebrick6'),
  +),
  +registered-credit-card: (
  +  title-color: r-color('charcoal'),
  +  base-color: r-color('purplish-grey'),
  +),
  ...
  +shadowed-box: (
  +  base-background: r-color('white'),
  +  base-shadow: 0 2px 4px rgba(5, 18, 42, 0.19),
  +),
  ...
  +steps-breadcrumb: (
  +  icon-background-active: r-color(purplish-grey),
  +  icon-background: transparent,
  +  icon-border-active: transparent,
  +  icon-border: r-color('light-grey'),
  +  icon-fill-active: r-color('white'),
  +  icon-fill: r-color('light-grey'),
  +  icon-outline: rgba(r-color(purplish-grey), 0.25),
  +  label-color-active: r-color('charcoal'),
  +  label-color: r-color('light-grey'),
  +  separator-background-active: rgba(r-color(purplish-grey), 0.6),
  +  separator-background: rgba(r-color(purplish-grey), 0.25),
  +),
  +steps-content: (
  +  content-color: r-color(purplish-grey),
  +  icon-background: r-color(indianred3),
  +  icon-color: r-color('white'),
  +  icon-big-background: transparent,
  +  icon-big-color: r-color('charcoal'),
  +  icon-success-background: r-color('mantis'),
  +  icon-success-color: r-color('white'),
  +  title-color: r-color('charcoal'),
  +  subtitle-color: r-color(purplish-grey),
  +)
  ```

- The `get_placeholder_plugins` and `get_page_plugins` template tags were merged in a single
  placeholder `get_placeholder_plugins` by making the `page_lookup` parameter optional.
  A new template tag `placeholder_as_plugins` was introduced and should be used in place of
  the `get_placeholder_plugins` tag wherever you want a real placeholder (with markup for
  frontend editing) and not just getting the related plugins.
- Don't use the `blockplugin` template tag in the page <header>. They can be replaced by a
  simple {% if %} tag since their only purpose is to inject markup for frontend editing (which
  is not valid html in the page header).
- The `runs_open` django template block have been replaced by `run_open_single` and
  `runs_open_multiple` blocks on the `course_detail.html` template.
- The `contact` block has been removed from the `course_detail.html` template, if you overwrite it
  please consider the new `run_open_single` block as alternative.
- Frontend override system has been updated to allow overriding of any frontend module.
  Thus if you override some components, you have to update the module regexp by prefixing
  with `components/`.

  ```diff
  - "CourseGlimpse/CourseGlimpseFooter.tsx": "../../../../../js/components/CourseGlimpse/CourseGlimpseFooter.tsx"
  + "components/CourseGlimpse/CourseGlimpseFooter.tsx$": "../../../../../js/components/CourseGlimpse/CourseGlimpseFooter.tsx"
    ```
- If you customize the `course-detail` block theme add the `checkmark-list-decoration-color` variable.

## 2.12.x to 2.13.x

- Add `dal` and `dal_select2` to your installed apps.
  ```python
  INSTALLED_APPS = (
      # ...
      'dal',
      'dal_select2',
  )
  ```

## 2.11.x to 2.12.x

- If you overrode `course-detail` theme within `theme.scss`, you have to add these four
  new properties
  ```scss
  view-more-runs-color: r-color('firebrick6'),
  run-catalog-visibility-hidden-logo: url('../../richie/images/catalog_visibility/hidden.svg'),
  run-catalog-visibility-course-only-logo: url('../../richie/images/catalog_visibility/course_only.svg'),
  run-catalog-visibility-logo-color: r-color('indianred3'),
  ```

## 2.10.x to 2.11.x

- If you overrode `richie/base.html`, the `branding_footer` template block has been renamed to
  `body_footer_brand` and the link was integrated in the block so it can be customized.
- The file `_colors.scss` has been divided into `_palette.scss` for the palette,
  `_gradients.scss`, `_schemes.scss`  and `_theme.scss`. Those files are now located in a
  dedicated folder `colors`.

## 2.9.x to 2.10.x

- Add easing timing function variables to `settings/_variables.scss`:
  ```css
  // Easings (Quart)
  $r-ease-in: cubic-bezier(0.5, 0, 0.75, 0);
  $r-ease-out: cubic-bezier(0.25, 1, 0.5, 1);
  $r-ease-in-out: cubic-bezier(0.76, 0, 0.24, 1);
  ```
- Define the `form` scheme within `settings/_colors.scss` and import the new CSS file related to
  forms in `_main.scss`:
  ```css
  @import 'richie-education/scss/objects/form';
  ```
- Add to `spinner` scheme property `base-color-light`
- Import the new CSS file related to modal in `_main.scss`:
  ```css
  @import 'richie-education/js/components/Modal/styles';
  ```
  These new styles also require modifications to variables
  in `settings/_colors.scss`. To keep the existing behaviors unchanged:
    - create a new `modal` entry at the same level as
    `search-filters-group-modal`;
    - move `base-background`, `base-border`, `base-color` and
    `overlay-background` from `search-filters-group-modal` to `modal`;
    - copy `close-background`, `close-border` and `close-color` from
    `search-filters-group-modal` to `modal`;
    - delete `modal-overlay-background` from `search-filters-group`.

  Here is a code example of valid values for these entries:
  ```css
  search-filters-group: (
    title-color: r-color('battleship-grey'),
  ),
  modal: (
    base-background: r-color('white'),
    base-border: r-color('battleship-grey'),
    base-color: r-color('battleship-grey'),
    close-background: r-color('white'),
    close-border: r-color('silver'),
    close-color: r-color('black'),
    overlay-background: r-color('white'),
  ),
  search-filters-group-modal: (
    button-background: r-color('white'),
    button-color: r-color('dark-aquamarine'),
    close-background: r-color('white'),
    close-border: r-color('silver'),
    close-color: r-color('black'),
    input-background: r-color('silver'),
    input-color: r-color('black'),
    item-border: r-color('silver'),
  ),
  ```

## 2.8.x to 2.9.x

- Add `django.contrib.humanize` to your installed apps.
  ```python
  INSTALLED_APPS = (
      # ...
      'django.contrib.humanize',
  )
  ```
- If you want to activate the new feature showing the enrollment count on the course detail page,
  set the `RICHIE_MINIMUM_COURSE_RUNS_ENROLLMENT_COUNT` setting to a value greater than 0, to
  specify the minimum number of enrollments for a course (accross all its sessions) starting from
  which you want to show the enrollment count. It will display as: "1000 already enrolled!"

## 2.7.x to 2.8.x

- `.no-scheme-fill` css class util has been removed.
- `IndexableMPTTFilterDefinition` class was renamed to `IndexableHierarchicalFilterDefinition`.
  If your project defines custom filter definitions in the `RICHIE_FILTERS_CONFIGURATION`
  setting, you need to make sure you don't point to the old class name.
- A new scss variable has been added `$r-course-subheader-aside`. If you have overridden
  `_variables.scss` file, you have to define this variable.
- Add a new entry to your `urls.py` declarations for the `robot.txt` file so
  that the `sitemap.xml` file is found without the need to register it in each
  crawler administration panel:
  ```python
    path(
        "robots.txt",
        TemplateView.as_view(
            template_name="richie/robots.html", content_type="text/plain"
        ),
    )
  ```

## 2.4.x to 2.5.x

- Named capturing group regex are still considered experimental in Javascript and may cause trouble
  with old browsers, so we decided to remove this feature from Richie and use indexed capturing
  group instead. As a consequence, you should update your `JS_COURSE_REGEX` setting to remove
  the `course_id`named group.
- Frontend JS is now generated into a dedicated `build` folder inside `static/js`. So if you need
  these scripts in templates, you have to update the script tag src to new destination.
  `static/js/index.js` becomes `static/js/build/index.js`

## 2.2.x to 2.4.x

- An API endpoint has been created to retrieve the context of a LTI Consumer plugin.
  You need to append this route to api routes in your `urls` configuration. Furthermore
  to optimize db accesses, if a cache called `memory_cache` is defined in `CACHES`,
  the response will be cached for 9min 30s.

## 2.1.x to 2.2.x

- A new `COURSE_RUN_SYNC_NO_UPDATE_FIELDS` setting has been added to `RICHIE_LMS_BACKENDS`.
  These fields will not be updated by the course run synchronization hook.
- A css `.banner` component has been created. You need to import the component style
  `objects/_banner.scss` into your main stylesheet to be able to use it.
- A css LtiConsumer component has been created for the new LTI consumer plugin. You need to
  import the component style `../js/components/LtiConsumer/styles` into your main stylesheet
  so the LTI consumer plugin renders as expected.

## 2.0.x to 2.1.x

- `RICHIE_AUTHENTICATION_DELEGATION["PROFILE_URLS"]` setting is now a dictionary : a key has been
  added to each url, permitting to get one easily.
- Richie has now its own error templates. You can use them by setting `handler400`, `handler403`,
  `handler404` and `handler500` to its related view
  (`richie.apps.core.views.error.error_<ERROR_CODE>_view_handler`).
  - In your project's `urls.py`, add these lines at the end of the file:
    ```diff
        ...
    +   handler400 = "richie.apps.core.views.error.error_400_view_handler"
    +   handler403 = "richie.apps.core.views.error.error_403_view_handler"
    +   handler404 = "richie.apps.core.views.error.error_404_view_handler"
    +   handler500 = "richie.apps.core.views.error.error_500_view_handler"
    ```

## 1.17.x to 2.0.x

- Richie version 2 introduces a new `AUTHENTICATION_BACKEND` setting used to get session information
  from OpenEdX through CORS requests. So login, register and logout routes are constructed from
  the BASE_URL of this setting. Furthermore it takes an extra property `PROFILE_URLS`.
  This property is consumed by UserLogin react component to display links that should redirect user
  on backend authentication account views (e.g: Profile, Dashboard, Settings).
- Richie version 2 is a major overhaul of all the project's templates and css files to bring
  a complete new design. If you were overriding the old templates and css base, you have 2
  options:
  - copy the old templates and css files to your project and start maintaining them on your own,
  - refactor your project to accomodate the new design.
- Section plugin template "section_cadenced" has been removed since it was covering special
  case from old layout integration. A migration has been added to automatically update Section
  plugins which used it to use the default one instead (the first from `SECTION_TEMPLATES`
  choices). You may have to upgrade your settings if you were overriding it through
  `RICHIE_SECTION_TEMPLATES`.
- Section plugin template "section_list" has been removed since it was covering special case
  for footer menu which is now intended to be done with new `NestedItem`. A migration has been
  added to automatically update Section plugins which used it to use the default one instead
  (the first from `SECTION_TEMPLATES` choices). You may have to upgrade your settings if
  you were overriding it through `RICHIE_SECTION_TEMPLATES`. Also we recommend you to rebuild
  your footer menu with `NestedItem` instead of `Section` plugins.
- Course plugin variant choices has been updated. Previously "small" variant existed but do nothing,
  now this variant apply same styles than default variant to prevent layout issue. Furthermore a
  "large" variant has been added which display larger course glimpse.

## 1.16.x to 1.17.x

- The template tags related to placeholders were refactored to fix ghost placeholders. This
  change impacts the use of template tags in all templates:
  - The `fragment_course_content.html` template is removed and its content is inserted directly
    in the `course_detail.html` and `course_run_detail.html` templates, using the `placeholder`
    template tag for the former and the `show_placeholder` template tag for the latter;
  - The `get_page_placeholder` template tag is removed and replaced either by `placeholder` when
    it is used on its own page and `show_placeholder` when it is used on another page;
  - The `get_placeholder_plugins` template tag is replaced by a new `get_page_plugins` template
    tag when it is used on another page than the placeholder's own page.
- This release changes names for ElasticSearch indices. Unless they explicitly use
  `RICHIE_ES_INDICES_PREFIX` setting to replicate the previous behavior (by setting it to
  `"richie"`), all users will have to regenerate all ElasticSearch indices (can be done by running
  the `bootstrap_elasticsearch` command).

## 1.15.x to 1.16.x

- If you override the `courses/cms/blogpost_list.html` template and want to benefit from the
  display of news-related categories on top of the page, you need to add the new markup and css.
- All occurences of the `form_factor` variable have been renamed to `variant` for clarity.
  Search and replace throughout your template overrides.
- The `courses/cms/fragment_category_glimpse.html` and `courses/plugins/category_plugin.html`
  templates were refactored for a better modularity and harmonization with other types of pages.
  You must port these modifications to your project if you override either of these two templates.
- Users who make use of `<SearchSuggestField />` or `<RootSearchSuggestField />` in their own
  templates through `richie-react` need to update all the call sites: the `context` prop is now
  required for both of them. See the documentation for more details on `context`.

## 1.14.x to 1.15.x

- If you override the `courses/cms/blogpost_list.html` and/or `courses/cms/blogpost_detail.html`
  templates, you need to port the modifications made to display the `publication_date` instead of
  the `creation date` and to hide blog posts that are not in the publication window from the
  public site.
- Users who changed the `search.html` template need to update it to include the page title and
  search bar themselves. They need to add a `<h1>` where they wish on the page, and the
  `<SearchSuggestField />` component through the django-react interop somewhere on the page too.

## 1.13.x to 1.14.x

- If you reused any React components in Django templates through `richie-react`, you should know
  that the `data-locale` attribute on them is no longer used. Instead, they rely on `<html lang>`
  to pick up their current locale, which should already be set in all documents anyway.
- As a result, the `lang` attribute on `<html>`, which is a requirement for an accessible page
  anyway, is now an absolute requirement. Users who overrode the base template and removed this
  need to add it again.
- Users who overrode the `REACT_LOCALES` setting need to rename it to `RFC_5646_LOCALES` and make
  sure it contains BCP47/RFC5646 locales (`REACT_LOCALES` used ISO15897 locales).
- Footer links are now defined via a static placeholder (see CHANGELOG). Richie provides a data
  migration to make sure that an existing footer of flat links is ported to the new static
  placeholder. Before running the data migration, make sure all changes on the footer pages
  (pages that are below the page with a reverse_id of "annex") are published. After running the
  data migration, check the footer (draft and public in each language) to make sure it is as
  expected.

## 1.12.x to 1.13.x

- A login/signup component was added at the top right of all pages. It comes with new url routes
  that you must add to your project:
  - In your project's `urls.py` non-i18n patterns, add user-related API endpoints via richie's
    core app urls:
    ```diff
    ...
    + from richie.apps.core.urls import urlpatterns as core_urlpatterns
    ...
    urlpatterns = [
        ...
    -     url(r"^api/{}/".format(API_PREFIX), include(search_urlpatterns)),
    +    url(
    +         r"^api/{}/".format(API_PREFIX),
    +         include([*core_urlpatterns, *search_urlpatterns]),
    +     ),
        ...
    ]
    ```
  - In your project's `urls.py` i18n patterns, add Django contrib auths urls:
    ```diff
    urlpatterns += i18n_patterns(
        ...
    +   url(r"^accounts/", include("django.contrib.auth.urls")),
        ...
    )
    ```
  - In your project's settings, configure login and logout redirect urls:
    ```diff
    ...
    + LOGIN_REDIRECT_URL = "/"
    + LOGOUT_REDIRECT_URL = "/"
    ```
- If you override the `menu/language_menu.html` template, you should now include the `<ul>` tag in this
  template and not in `richie/base.html` so that it does not render as an empty element on sites with
  only one public language,
- If you override templates that contain React hooks, rename the `fun-react` class to`richie-react`.

## 1.11.x to 1.12.x

If you override `_course_detail.scss`, the `course-detail__aside__run` selector was renamed
to `course-detail__aside__runs` in our `course_detail.html` template.

## 1.10.x to 1.11.x

No specific actions are required for this release.

## 1.9.x to 1.10.x

- Icon font has been removed and replaced with SVG icons. Any overridden
  template(s) using icons from the icon font need to be updated to use SVG
  icons too.
- For each item in the [changelog](./CHANGELOG.md), check that your css overrides have no impact.

## 1.8.x to 1.9.x

A new third party application was added to enable pagination on blogposts and persons list.
You must update your settings as follows:

- Add `dj-pagination` to your installed apps:
  ```python
  INSTALLED_APPS = (
      # ...
      'dj_pagination',
  )
  ```
- Add the pagination middleware to your settings:
  ```python
  MIDDLEWARE = (
      # ...
      'dj_pagination.middleware.PaginationMiddleware',
  )
  ```
- Add pagination options to your settings as per your requirements.
  See https://dj-pagination.readthedocs.io/en/latest/usage.html#optional-settings for a list of
  all available settings.
