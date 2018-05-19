"""
WSGI config for richie project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/1.8/howto/deployment/wsgi/
"""

import os

from raven.contrib.django.raven_compat.middleware.wsgi import Sentry

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "richie.settings")
os.environ.setdefault("DJANGO_CONFIGURATION", "Development")

# pylint: disable=wrong-import-position
from configurations.wsgi import get_wsgi_application  # noqa

application = Sentry(get_wsgi_application())  # pylint: disable=invalid-name
