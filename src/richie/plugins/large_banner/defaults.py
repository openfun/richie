"""
Large banner plugin field choices
"""
from django.conf import settings
from django.utils.translation import ugettext_lazy as _

LARGEBANNER_TEMPLATES = getattr(
    settings,
    "RICHIE_LARGEBANNER_TEMPLATES",
    [("richie/large_banner/large_banner.html", _("Default"))],
)
