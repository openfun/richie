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
