"""
NestedItem plugin default settings
"""

from django.conf import settings
from django.utils.translation import gettext_lazy as _

ACCORDION, LIST = "accordion", "list"

NESTEDITEM_VARIANTS = getattr(
    settings,
    "RICHIE_NESTEDITEM_VARIANTS",
    [(LIST, _("List")), (ACCORDION, _("Accordion"))],
)
