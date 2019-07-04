"""
Section plugin default settings
"""
from django.conf import settings
from django.utils.translation import ugettext_lazy as _

SECTION_TEMPLATES = getattr(
    settings,
    "RICHIE_SECTION_TEMPLATES",
    [
        ("richie/section/section.html", _("Default")),
        ("richie/section/section_cadenced.html", _("Highlighted items")),
    ],
)
