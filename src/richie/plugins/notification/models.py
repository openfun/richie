"""
Notification plugin models
"""
from django.db import models
from django.utils.translation import gettext_lazy as _

from cms.models.pluginmodel import CMSPlugin


class Notification(CMSPlugin):
    """
    Notification plugin model.

    To be user to output notification messages on course pages.
    """

    NOTIFICATION_TYPES = (
        ("info", _("Information")),
        ("warning", _("Warning")),
    )

    title = models.CharField(max_length=255, blank=True)
    message = models.CharField(_("Message"), max_length=255)
    template = models.CharField(
        _("Type"),
        choices=NOTIFICATION_TYPES,
        default=NOTIFICATION_TYPES[0],
        max_length=16,
    )
