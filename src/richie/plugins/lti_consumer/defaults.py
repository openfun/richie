"""Default settings for Richie's LTI consumer plugin."""

from django.conf import settings
from django.utils.translation import gettext_lazy as _

STUDENT = "student"
INSTRUCTOR = "instructor"
PREDEFINED_LTI_PROVIDERS = [(None, _("Custom provider configuration"))] + [
    (provider_key, provider.get("display_name", provider_key))
    for provider_key, provider in getattr(settings, "RICHIE_LTI_PROVIDERS", {}).items()
]
