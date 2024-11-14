"""Default settings for Richie's simple text plugin."""

from django.conf import settings
from django.utils.translation import gettext_lazy as _

SIMPLETEXT_CONFIGURATION = getattr(settings, "RICHIE_SIMPLETEXT_CONFIGURATION", [])

SIMPLETEXT_VARIANTS = getattr(
    settings,
    "RICHIE_SIMPLETEXT_VARIANTS",
    [
        ("", _("None")),
        ("round-box", _("Transparent box")),
        ("fulfilled", _("Fulfilled box")),
        ("stroked", _("Stroked box")),
    ],
)
