from .base import *  # noqa

DEBUG = True
ALLOWED_HOSTS = ['*']

try:
    from .local import *  # noqa
except ImportError:
    pass
