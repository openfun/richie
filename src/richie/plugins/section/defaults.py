"""
Section plugin default settings
"""

from django.conf import settings
from django.utils.translation import gettext_lazy as _

SECTION_TEMPLATES = getattr(
    settings,
    "RICHIE_SECTION_TEMPLATES",
    [
        ("richie/section/section.html", _("Default")),
        ("richie/section/section_primary.html", _("Primary scheme")),
        ("richie/section/section_secondary.html", _("Secondary scheme")),
        ("richie/section/section_tertiary.html", _("Tertiary scheme")),
        ("richie/section/section_quaternary.html", _("Quaternary scheme")),
        ("richie/section/section_quinary.html", _("Quinary scheme")),
        ("richie/section/section_senary.html", _("Senary scheme")),
        ("richie/section/section_septenary.html", _("Septenary scheme")),
        ("richie/section/section_tiles.html", _("Item tiles")),
    ],
)
