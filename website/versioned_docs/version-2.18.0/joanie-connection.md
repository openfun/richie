---
id: joanie-connection
title: Joanie Connection
sidebar_label: Joanie Connection
---
# Joanie Connection

## Settings

All settings related to Joanie have to be declared in the `JOANIE_BACKEND` dictionary
within `settings.py`.
To enable Joanie, the minimal configuration requires following properties:

- `BASE_URL`
- `BACKEND`
- `COURSE_REGEX`
- `JS_COURSE_REGEX`

Take a look to [LMS Backend documentation](./lms-backends.md#configuring-the-lms-handler) to get details about those properties.

Add to your `settings.py`:

```python
...
JOANIE_BACKEND = {
    "BASE_URL": values.Value(environ_name="JOANIE_BASE_URL", environ_prefix=None),
    "BACKEND": values.Value("richie.apps.courses.lms.joanie.JoanieBackend", environ_name="JOANIE_BACKEND", environ_prefix=None),
    "JS_BACKEND": values.Value("joanie", environ_name="JOANIE_JS_BACKEND", environ_prefix=None),
    "COURSE_REGEX": values.Value(
        r"^.*/api/(?P<resource_type>(course-runs|products))/(?P<resource_id>.*)/?$",
        environ_name="JOANIE_COURSE_REGEX",
        environ_prefix=None,
    ),
    "JS_COURSE_REGEX": values.Value(
        r"^.*/api/(course-runs|products)/(.*)/?$",
        environ_name="JOANIE_JS_COURSE_REGEX",
        environ_prefix=None,
    ),
}
...
```

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
