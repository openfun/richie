---
id: lms-backends
title: Configuring LMS Backends
sidebar_label: LMS Backends
---

Richie can be connected to one or more OpenEdX Learning Management Systems (LMS) for a seamless
experience between browsing the course catalog on Richie, enrolling to a course and following the
course itself on the LMS.

It is possible to do the same with Moodle or any other LMS exposing an enrollment API, at the
cost of writing a custom LMS handler backend.

## Prerequisites

This connection requires that Richie and OpenEdX be hosted on sibling domains i.e. domains that
are both subdomains of the same root domain, e.g. `richie.example.com` and `lms.example.com`.

OpenEdX will need to generate a CORS CSRF Cookie and this cookie is flagged as secure, which
implies that we are not able to use it without SSL connections.

As a consequence, you need to configure your OpenEdX instance as follows:

```python
FEATURES = {
    ...
    "ENABLE_CORS_HEADERS": True,
    "ENABLE_CROSS_DOMAIN_CSRF_COOKIE": True,
}

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_INSECURE = False
CORS_ORIGIN_WHITELIST: ["richie.example.com"]  # The domain on which Richie is hosted

CROSS_DOMAIN_CSRF_COOKIE_DOMAIN = ".example.com"  # The parent domain shared by Richie and OpenEdX
CROSS_DOMAIN_CSRF_COOKIE_NAME: "edx_csrf_token"
SESSION_COOKIE_NAME: "edx_session"
```

## Configuring the LMS handler

The `LMSHandler` utility acts as a proxy that routes queries to the correct LMS backend API,
based on a regex match on the URL of the course. It is configured via the `RICHIE_LMS_BACKENDS`
setting. As an example, here is how it would be configured to connect to an Ironwood OpenEdX
instance hosted on `https://lms.example.com`:

```python
RICHIE_LMS_BACKENDS=[
    {
        "BASE_URL": "https://lms.example.com",
        # Django
        "BACKEND": "richie.apps.courses.lms.edx.EdXLMSBackend",
        "COURSE_REGEX": r"^https://lms\.example\.com/courses/(?P<course_id>.*)/course/?$",
        # ReactJS
        "JS_BACKEND": "openedx-hawthorn",
        "JS_COURSE_REGEX": r"^https://lms\.example\.com/courses/(.*)/course/?$",
        # Course runs synchronization
        "COURSE_RUN_SYNC_NO_UPDATE_FIELDS": [],
        "DEFAULT_COURSE_RUN_SYNC_MODE": "sync_to_public",
    },
]
```

The following should help you understand how to configure this setting:

### BASE_URL

The base url on which the OpenEdX instance is hosted. This is used to construct the complete url
of the API endpoint on which the enrollment request is made by Richie's frontend application.

- Type: string
- Required: Yes
- Value: for example https://lms.example.com


### BACKEND

The path to a Python class serving as LMS backend for the targeted LMS.

- Type: string
- Required: Yes
- Value: Richie ships with the following Python backends (custom backends can be written to fit
  another specific LMS):
    + `richie.apps.courses.lms.edx.EdXLMSBackend`: backend for OpenEdX
    + `richie.apps.courses.lms.base.BaseLMSBackend`: fake backend for development purposes


### COURSE_REGEX

A Python regex that should match the course syllabus urls of the targeted LMS and return a
`course_id` named group on the id of the course extracted from these urls.

- Type: string
- Required: Yes
- Value: for example `^.*/courses/(?P<course_id>.*)/course/?$`


### JS_BACKEND

The name of the ReactJS backend to use for the targeted LMS.

- Type: string
- Required: Yes
- Value: Richie ships with the following Javascript backends (custom backends can be written to
  fit another specific LMS):
    + `openedx-dogwood`: backend for OpenEdX versions equal to `dogwood` or `eucalyptus`
    + `openedx-hawthorn`: backend for OpenEdX versions equal to `hawthorn` or higher
    + `openedx-fonzie`: backend for OpenEdX via [Fonzie](https://github.com/openfun/fonzie)
        (extra user info and JWT tokens)
    + `base`: fake backend for development purposes

### JS_COURSE_REGEX

A Javascript regex that should match the course syllabus urls of the targeted LMS and return an
unnamed group on the id of the course extracted from these urls.

- Type: string
- Required: Yes
- Value: for example `^.*/courses/(.*)/course/?$`

### DEFAULT_COURSE_RUN_SYNC_MODE

When a course run is created, this setting is used to set the value of the `sync_mode` field.
This value defines how the course runs synchronization script will impact this course run after
creation.

- Type: enum(string)
- Required: No
- Value: possible values are `manual`, `sync_to_draft` and `sync_to_public`
    + `manual`: this course run is ignored by the course runs synchronization script
    + `sync_to_draft`: only the draft version of this course run is synchronized. A manual
        publication is necessary for the update to be visible on the public site.
    + `sync_to_public`: the public version of this course run is updated by the synchronization
        script. As a results, updates are directly visible on the public site without further
        publication by a staff user in Richie.

### COURSE_RUN_SYNC_NO_UPDATE_FIELDS

A list of fields that must only be set the first time a course run is synchronized. During this
first synchronization, a new course run is created in Richie and all fields sent to the API
endpoint via the payload are set on the object. For subsequent synchronization calls, the fields
listed in this setting are ignored and not synchronized. This can be used to allow modifying some
fields manually in Richie regardless of what OpenEdX sends after an initial value is set.

Note that this setting is only effective for course runs with the `sync_mode` field set to a
value other then `manual`.

- Type: enum(string)
- Required: No
- Value: for example ["languages"]


## Technical support

If you encounter an issue with this documentation or the backends included in Richie, please
[open an issue on our repository](https://github.com/openfun/richie/issues).

If you need a custom backend, you can [submit a PR](https://github.com/openfun/richie/pulls) or
[open an issue](https://github.com/openfun/richie/issues) and we will consider adding it.
