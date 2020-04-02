"""
NestedItem plugin default settings
"""
from django.conf import settings
from django.utils.translation import ugettext_lazy as _

NESTEDITEM_VARIANTS = getattr(
    settings,
    "RICHIE_NESTEDITEM_VARIANTS",
    [
        (None, _("Inherit")),
        ("default", _("Default")),
        ("accordion", _("Accordion")),
        ("list", _("List")),
    ],
)
