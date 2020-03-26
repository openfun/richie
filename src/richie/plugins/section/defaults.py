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
        ("richie/section/section--light.html", _("Light")),
        ("richie/section/section--lightest.html", _("Lightest")),
        ("richie/section/section--gradient-light.html", _("Light gradient")),
        ("richie/section/section--gradient-dark.html", _("Dark gradient")),
        ("richie/section/section--clouds.html", _("Clouds")),
        ("richie/section/section--divider-top.html", _("Top divider")),
        ("richie/section/section_list.html", _("Unordered list")),
        ("richie/section/category-tiles.html", _("Category tiles")),
        ("richie/section/section--blogpost.html", _("Favorite blogpost")),
    ],
)
