---
id: lms-connection
title: Connecting Richie with an LMS
sidebar_label: LMS connection
---

`richie` can be connected to one or more Learning Management Systems (LMS) like OpenEdx, Moodle
or Canvas for a seamless experience between browsing the course catalog on `richie` and following
the course itself on the LMS.

When `richie` is connected simultaneously to several LMSes, the link between a specific course in
the catalog and its corresponding course in an LMS, is done by matching its URL with regex
patterns. These regex patterns are fully configurable via the `LMS_BACKENDS` setting in `richie`.

In order to connect `richie` with an LMS, there are two separate subjects:

- SSO to share user accounts between `richie` and the LMS. In case of several LMSes, an additional
  platform may be required to federate identities (e.g. [keycloak.org](https://www.keycloak.org)),
- API bridge to synchronize course information and enrollments.

## SSO

Richie comes with two pre-defined SSO backends for OpenEdx, acting as an oauth2 provider:

- `EdXOAuth2`: from `Eucalyptus` version to `Hawthorn` version included,
- `EdXOIDC`: for the `Dogwood` version.

You must first add the required backends to the list of Django's authentication backends in your
project's settings file:

```python
AUTHENTICATION_BACKENDS = (
    "richie.apps.core.backends.EdXOAuth2",
    "richie.apps.core.backends.EdXOIDC",
    "django.contrib.auth.backends.ModelBackend",
)
```

### OpenEdx Dogwood

For OpenEdx Dogwood, configure the `EDX_OIDC` backend in your project's settings:

```python
SOCIAL_AUTH_EDX_OIDC_KEY = "social-id"
SOCIAL_AUTH_EDX_OIDC_SECRET = "fakesecret"
SOCIAL_AUTH_EDX_OIDC_ID_TOKEN_DECRYPTION_KEY = "fakekey"
SOCIAL_AUTH_EDX_OIDC_ENDPOINT = "https://edx:8073/oauth2
```

### OpenEdx Eucalyptus to Hawthorn

From OpenEdx Eucalyptus up to Hawthorn, configure the `EDX_OAUTH2` backend in your project's settings:

```python
SOCIAL_AUTH_EDX_OAUTH2_KEY = "social-id"
SOCIAL_AUTH_EDX_OAUTH2_SECRET = "fakesecret"
SOCIAL_AUTH_EDX_OAUTH2_ENDPOINT = "https://edx:8073/oauth2
```

for other LMSes, note that any other authentication backend may be used, like those available from
[social core](https://github.com/python-social-auth/social-core/tree/master/social_core/backends).
Additional backends, specific to a third party LMS, can be added to `richie` upon request or by
submitting a Pull Request.


### API bridge

The `LMSHandler` utility class acts as a proxy that routes queries to the correct LMS backend,
based on a regex match on the URL of the course.

Several LMS backends can be configured in order of priority by adding the `LMS_BACKENDS` setting
to your project:

```python
LMS_BACKENDS=[
    {
        "BACKEND": "richie.apps.courses.lms.edx.TokenEdXLMSBackend",
        "SELECTOR_REGEX": r".*lms-example1.org.*",
        "BASE_URL": "https://www.lms-example1.org",
        "COURSE_REGEX": r"^.*/courses/(?P<course_id>.*)/info$",
        "API_TOKEN": "fakesecret1",
    },
    {
        "BACKEND": "richie.apps.courses.lms.edx.TokenEdXLMSBackend",
        "SELECTOR_REGEX": r".*lms-example2.org.*",
        "BASE_URL": "https://www.lms-example2.org",
        "COURSE_REGEX": r"^.*/course/(?P<course_id>[0-9]*)$",
        "API_TOKEN": "fakesecret2",
    },
] 
```

For information about how to generate an API access on your OpenEdx instance, refer to the
documentation.

Note: [OpenEdx Docker](https://github.com/openfun/openedx-docker) provides a utility script that
pre-configures OpenedX with the credentials used in richie's sandbox, so that the connection
works out-of-the-box for development:

```bash
make auth-init
```
