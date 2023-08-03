---
id: joanie-connection
title: Joanie Connection
sidebar_label: Joanie Connection
---

[Joanie](https://github.com/openfun/joanie) delivers an API able to manage course
enrollment/subscription, payment and certificates delivery. Richie can be configured to display
course runs and micro-credentials managed through Joanie.

In fact, Richie treats Joanie almost like a [LMS backend](./lms-backends.md) that's why settings
are similars.

## Configuring Joanie

All settings related to Joanie have to be declared in the `JOANIE_BACKEND` dictionnary
within `settings.py`.

```python
JOANIE_BACKEND = {
    "BASE_URL": values.Value(environ_name="JOANIE_BASE_URL", environ_prefix=None),
    "BACKEND": values.Value("richie.apps.courses.lms.joanie.JoanieBackend", environ_name="JOANIE_BACKEND", environ_prefix=None),
    "JS_BACKEND": values.Value("joanie", environ_name="JOANIE_JS_BACKEND", environ_prefix=None),
    "COURSE_REGEX": values.Value(
        r"^.*/api/v1.0(?P<resource_uri>(?:/(?:courses|course-runs|products)/[^/]+)+)/?$",
        environ_name="JOANIE_COURSE_REGEX",
        environ_prefix=None,
    ),
    "JS_COURSE_REGEX": values.Value(
        r"^.*/api/v1.0((?:/(?:courses|course-runs|products)/[^/]+)+)/?$",
        environ_name="JOANIE_JS_COURSE_REGEX",
        environ_prefix=None,
    ),
    # Course runs synchronization
    "COURSE_RUN_SYNC_NO_UPDATE_FIELDS": [],
    "DEFAULT_COURSE_RUN_SYNC_MODE": "sync_to_public",
}
...
```

As mentioned earlier, Joanie is treated as a LMS by Richie, so we have to bind Joanie settings with
LMS backends settings. We achieve this by dynamically appending the `JOANIE_BACKEND` setting value 
into the `RICHIE_LMS_BACKENDS` list, if Joanie is enabled. To understand this point, you can take a
look at the `post_setup` method of the Base class configuration into `settings.py`.

Here they are all settings available into `JOANIE_BACKEND`:

### BASE_URL

The base url on which the Joanie instance is hosted. This is used to construct the complete url of
the API endpoint on which requests are made by Richie's frontend application. *Richie checks if this
settings is set to know if Joanie should be enabled or not.*

- Type: string
- Required: Yes
- Value: for example https://joanie.example.com

### BACKEND

The path to a Python class serving as Joanie backend. You should not need to change this setting
until you want to customize the behavior of the python Joanie backend.

- Type: string
- Required: No
- Value: By default it is `richie.apps.courses.lms.joanie.JoanieBackend`

### JS_BACKEND

The name of the ReactJS backend to use Joanie. You should not need to change this setting
until you want to customize the behavior of the js Joanie backend.

- Type: string
- Required: No
- Value: By default it is `joanie`.

### COURSE_REGEX

A python regex that should match the ressource api urls of Joanie and return a
`resource_uri` named group. The `resource_uri` group should contain the url part containing
all resources type and id implied.
e.g: `https://joanie.test/courses/00003/products/000001/` -> `/courses/00003/products/000001`

- Type: string
- Required: No
- Value: for example `r"^.*/api/v1.0(?P<resource_uri>(?:/(?:courses|course-runs|products)/[^/]+)+)/?$"`


### JS_COURSE_REGEX

A Javascript regex that should match the ressource api urls of Joanie and return an unamed group 
corresponding to the `resource_uri` named group described in `COURSE_REGEX` section. Extracting
properly this information is mandatory as this group is parsed under the hood
by the frontend application to extract resource types and resource ids.

- Type: string
- Required: No
- Value: for example `r"^.*/api/v1.0((?:/(?:courses|course-runs|products)/[^/]+)+)/?$"`

### COURSE_RUN_SYNC_NO_UPDATE_FIELDS

A list of fields that must only be set the first time a course run is synchronized. During this
first synchronization, a new course run is created in Richie and all fields sent to the API
endpoint via the payload are set on the object. For subsequent synchronization calls, the fields
listed in this setting are ignored and not synchronized. This can be used to allow modifying some
fields manually in Richie regardless of what OpenEdX sends after an initial value is set.

Read documentation of [the eponym `LMS_BACKENDS` settings](./lms-backends.md#course_run_sync_no_update_fields),
to discover how it can be configured.

### DEFAULT_COURSE_RUN_SYNC_MODE

Joanie resources (course runs and products) are all synchronized with Richie as a CourseRun. This
setting is used to set the value of the `sync_mode` field when a course run is created on Richie.
Read documentation of [the eponym `LMS_BACKENDS` settings](./lms-backends.md#default_course_run_sync_mode),
to discover how it can be configured.

## Access Token
### Lifetime configuration
Access Token is stored within the SessionStorage through [react-query client persister](https://tanstack.com/query/v4/docs/plugins/persistQueryClient).
By default, richie frontend considered access token as stale after 5 minutes. You can change this
value into [`settings.ts`](https://github.com/openfun/richie/blob/643d7bbdb7f9a02a86360607a7b37c587e70be1a/src/frontend/js/settings.ts)
by editing `REACT_QUERY_SETTINGS.staleTimes.session`.

To always have a valid access token, you have to configure properly its stale time according to the
lifetime of the access token defined by your authentication server. For example, if your
authentication server is using `djangorestframework-simplejwt` to generate the access token,
its lifetime is 5 minutes by default.

## Technical support

If you encounter an issue with this documentation, please
[open an issue on our repository](https://github.com/openfun/richie/issues).
