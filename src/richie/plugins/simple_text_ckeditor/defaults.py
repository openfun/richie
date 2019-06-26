"""Default settings for Richie's simple text plugin."""
from django.conf import settings

SIMPLETEXT_CONFIGURATION = getattr(settings, "RICHIE_SIMPLETEXT_CONFIGURATION", [])
