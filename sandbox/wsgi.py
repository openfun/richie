"""
WSGI config for richie project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/1.8/howto/deployment/wsgi/
"""

import os

# pylint: disable=wrong-import-position
from configurations.wsgi import get_wsgi_application  # noqa
from raven.contrib.django.raven_compat.middleware.wsgi import Sentry

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")
os.environ.setdefault("DJANGO_CONFIGURATION", "Development")


application = Sentry(get_wsgi_application())  # pylint: disable=invalid-name
