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

- Icon font has been removed and replaced with SVG icons. Any overridden
  template(s) using icons from the icon font need to be updated to use SVG
  icons too.

## 1.10.x to 1.11.x

## Before switching

- If you override `_course_detail.scss`, the `course-detail__aside__run` selector was renamed
  to `course-detail__aside__runs` in our `course_detail.html` template.

## 1.9.x to 1.10.x

### Before switching

- For each item in the [changelog](./CHANGELOG.md), check that your css overrides have no impact.

## 1.8.x to 1.9.x

### Before switching

- A new third party application was added to enable pagination on blogposts and persons list.
  You must update your settings as follows:

  * Add `dj-pagination` to your installed apps:
    ```python
    INSTALLED_APPS = (
        # ...
        'dj_pagination',
    )
    ```
  * Add the pagination middleware to your settings:
    ```python
    MIDDLEWARE = (
        # ...
        'dj_pagination.middleware.PaginationMiddleware',
    )
    ```
  * Add pagination options to your settings as per your requirements.
    See https://dj-pagination.readthedocs.io/en/latest/usage.html#optional-settings for a list of
    all available settings.
