---
id: joanie-connection
title: Joanie Connection
sidebar_label: Joanie Connection
---
# Joanie Connection

## Settings

All settings related to Joanie have to be declared in the `JOANIE` dictionary
within `settings.py`.
To enable Joanie, the minimal configuration requires one property:

- `BASE_URL` : the endpoint at which Joanie is accessible

Add to your `settings.py`:

```python
...
JOANIE = {
  "BASE_URL": values.Value(environ_name="JOANIE_BASE_URL", environ_prefix=None)
}
...
```

## Access Token
### Lifetime configuration
Access Token is stored within the SessionStorage through
[react-query client persistor](https://github.com/openfun/richie/blob/643d7bbdb7f9a02a86360607a7b37c587e70be1a/src/frontend/js/utils/react-query/createSessionStoragePersistor/index.ts).
By default, richie frontend considered access token as stale after 5 minutes. You can change this
value into [`settings.ts`](https://github.com/openfun/richie/blob/643d7bbdb7f9a02a86360607a7b37c587e70be1a/src/frontend/js/settings.ts)
by editing `REACT_QUERY_SETTINGS.staleTimes.session`.

To always have a valid access token, you have to configure properly its stale time according to the
lifetime of the access token defined by your authentication server. For example, if your
authentication server is using `djangorestframework-simplejwt` to generate the access token,
its lifetime is 5 minutes by default.
