"""
Glimpse plugin default settings
"""

from django.conf import settings
from django.utils.translation import gettext_lazy as _

BADGE, CARD_SQUARE, PERSON, QUOTE, ROW_HALF, ROW_FULL = (
    "badge",
    "card_square",
    "person",
    "quote",
    "row_half",
    "row_full",
)

GLIMPSE_VARIANTS = getattr(
    settings,
    "RICHIE_GLIMPSE_VARIANTS",
    [
        (None, _("Inherit")),
        (BADGE, _("Badge")),
        (CARD_SQUARE, _("Square card")),
        (PERSON, _("Person")),
        (QUOTE, _("Quote")),
        (ROW_HALF, _("Half row")),
        (ROW_FULL, _("Full row")),
    ],
)
