"""
Glimpse plugin default settings
"""
from django.conf import settings
from django.utils.translation import ugettext_lazy as _

GLIMPSE_VARIANTS = getattr(
    settings,
    "RICHIE_GLIMPSE_VARIANTS",
    [
        (None, _("Inherit")),
        ("card_square", _("Square card")),
        ("row_half", _("Half row")),
        ("row_full", _("Full row")),
    ],
)
