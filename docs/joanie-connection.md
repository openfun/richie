# Joanie Connection

## Settings

All settings related to Joanie have to be declared in the Joanie dictionnary in
your settings. The minimal configuration should contains Joanie's API endpoint.

In your `settings.py`:
```python
...
JOANIE = {
  "BASE_URL": values.Value(environ_name="JOANIE_BASE_URL", environ_prefix=None)
}
...
```
