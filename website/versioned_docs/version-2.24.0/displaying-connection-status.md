---
id: displaying-connection-status
title: Displaying OpenEdX connection status in Richie
sidebar_label: Displaying connection status
---

This guide explains how to configure Richie and OpenEdX to share the OpenEdX connection status
and display profile information for the logged-in user in Richie.

In Richie, the only users that are actually authenticated on the DjangoCMS instance producing the
site, are editors and staff users. Your instructors and learners will not have user accounts on
Richie, but authentication is delegated to a remote service that can be OpenEdX, KeyCloack, or
your own centralized identity management service.

In the following, we will explain how to use OpenEdX as your authentication delegation service.

## Prerequisites

Richie will need to make CORS requests to the OpenEdX instance. As a consequence, you need to
activate CORS requests on your OpenEdX instance:

```python
FEATURES = {
    ...
    "ENABLE_CORS_HEADERS": True,
}
```

Then, make sure the following settings are set as follows on your OpenEdX instance:

```python
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_INSECURE = False
CORS_ORIGIN_ALLOW_ALL = False
CORS_ORIGIN_WHITELIST: ["richie.example.com"]  # The domain on which Richie is hosted
```

## Allow redirects

When Richie sends the user to the OpenEdX instance for authentication, and wants OpenEdX to
redirect the user back to Richie after a successful login or signup, it prefixes the path with
`/richie`. Adding the following rule to your Nginx server (or equivalent) and replacing the
richie host by yours will allow this redirect to follow through to your Richie instance:

```
rewrite ^/richie/(.*)$ https://richie.example.com/$1 permanent;
```

## Configure authentication delegation

Now, on your Richie instance, you need to configure the service to which Richie will delegate
authentication using the `RICHIE_AUTHENTICATION_DELEGATION` setting:

```python
RICHIE_AUTHENTICATION_DELEGATION = {
    "BASE_URL": "https://lms.example.com",
    "BACKEND": "openedx-hawthorn",
    "PROFILE_URLS": {
        "dashboard": {
            "label": _("Dashboard"),
            "href": "{base_url:s}/dashboard",
        },
    },
}
```

The following should help you understand how to configure this setting:

### BASE_URL

The base url on which the OpenEdX instance is hosted. This is used to construct the complete url
of the login/signup pages to which the frontend application will send the user for authentication.

- Type: string
- Required: Yes
- Value: for example https://lms.example.com


### BACKEND

The name of the ReactJS backend to use for the targeted LMS.

- Type: string
- Required: Yes
- Value: Richie ships with the following Javascript backends:
    + `openedx-dogwood`: backend for OpenEdX versions equal to `dogwood` or `eucalyptus`
    + `openedx-hawthorn`: backend for OpenEdX versions equal to `hawthorn` or higher
    + `openedx-fonzie`: backend for OpenEdX via [Fonzie](https://github.com/openfun/fonzie)
        (extra user info and JWT tokens)
    + `base`: fake backend for development purposes


### PROFILE_URLS

Mapping definition of custom links presented to the logged-in user as a dropdown menu when he/she
clicks on his/her username in Richie's page header.

Links order will be respected to build the dropdown menu.

- Type: dictionary
- Required: No
- Value: For example, to emulate the links proposed in OpenEdX, you can configure this setting
  as follows:

    ```python
        {
            "dashboard": {
                "label": _("Dashboard"),
                "href": "{base_url:s}/dashboard",
            },
            "profile": {
                "label": _("Profile"),
                "href": "{base_url:s}/u/(username)",
            },
            "account": {
                "label": _("Account"),
                "href": "{base_url:s}/account/settings",
            }
        }
    ```

    The `base_url` variable is used as a Python format parameter and will be replaced by the value
    set for the above authentication delegation `BASE_URL` setting.

    If you need to bind user data into a url, wrap the property between brackets. For example, the
    link configured above for the profile page `{base_url:s}/u/(username)` would point to
    `https://lms.example.com/u/johndoe` for a user carrying the username `johndoe`.
