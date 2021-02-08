"""Default settings for Richie's LTI consumer plugin."""
from django.conf import settings

STUDENT = "student"
INSTRUCTOR = "instructor"
PREDEFINED_LTI_PROVIDERS = [
    (provider_key, provider.get("display_name", provider_key))
    for provider_key, provider in getattr(settings, "RICHIE_LTI_PROVIDERS", {}).items()
]
