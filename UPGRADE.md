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
