import json
import os

from django.core.exceptions import ImproperlyConfigured


# Load the content of a config.json file placed in the current directory if any.
# This file is were sensitive configuration settings are stored for a given environment
# This is a better practice security wise than using environment variables.
try:
    with open(os.path.join(os.path.dirname(__file__), 'config.json')) as f:
        config = json.loads(f.read())
except IOError:
    config = {}


def get_env_variable(var_name, **kwargs):
    """
    Try getting a setting from the current os environment using the given variable name.

    Raise error if the name is not found, except if the 'default' key is given in
    kwargs (using kwargs allows to pass a default to None, which is different
    from not passing any default):
        get_env_variable('foo')  # raise if `foo` not defined
        get_env_variable('foo', default='bar')  # will return 'bar' if `foo` is not defined
        get_env_variable('foo', default=None)  # will return `None` if `foo` is not defined
    """
    try:
        return os.environ[var_name]
    except KeyError:
        if 'default' in kwargs:
            return kwargs['default']
        raise ImproperlyConfigured('Please set the "%s" environment variable.'.format(var_name))


def get_config(var_name, **kwargs):
    """
    Try getting a setting from the config.json file or the current os environment using the
    given variable name.

    get_config will return in order of priority:
        - the value set in a config.json file placed in the current directory,
        - the value set in an environment variable,
        - the value passed as default.

    Raise error if the name is not found, except if the 'default' key is given in
    kwargs (using kwargs allows to pass a default to None, which is different
    from not passing any default):
        get_config('foo')  # raise if `foo` not defined
        get_config('foo', default='bar')  # will return 'bar' if `foo` is not defined
        get_config('foo', default=None)  # will return `None` if `foo` is not defined
    """
    try:
        return config[var_name]
    except KeyError:
        try:
            return get_env_variable(var_name)
        except ImproperlyConfigured:
            if 'default' in kwargs:
                return kwargs['default']
        raise ImproperlyConfigured(
            'Please set the "{:s}" variable in a config.json file '
            'or as environment variable.'.format(var_name))
