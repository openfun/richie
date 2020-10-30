"""
Glimpse plugin default settings
"""
from django.conf import settings
from django.utils.translation import gettext_lazy as _

CARD_SQUARE, ROW_HALF, ROW_FULL, QUOTE = (
    "card_square",
    "row_half",
    "row_full",
    "quote",
)

GLIMPSE_VARIANTS = getattr(
    settings,
    "RICHIE_GLIMPSE_VARIANTS",
    [
        (None, _("Inherit")),
        (CARD_SQUARE, _("Square card")),
        (ROW_HALF, _("Half row")),
        (ROW_FULL, _("Full row")),
        (QUOTE, _("Quote")),
    ],
)
