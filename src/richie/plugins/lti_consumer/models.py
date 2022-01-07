"""
LTI consumer plugin models
"""
from urllib.parse import unquote

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import translation
from django.utils.functional import lazy
from django.utils.translation import gettext_lazy as _

import exrex
from cms.models.pluginmodel import CMSPlugin
from cms.utils import get_current_site
from oauthlib import oauth1

from .defaults import INSTRUCTOR, PREDEFINED_LTI_PROVIDERS, STUDENT


class LTIConsumer(CMSPlugin):
    """
    LTI consumer plugin model.
    """

    RESOURCE_NAME = "lti-consumer"

    url = models.URLField(
        verbose_name=_("LTI url"),
        help_text=_(
            "For a predefined provider, leave this field empty for uploading new content."
        ),
        null=False,
        blank=True,
    )
    lti_provider_id = models.CharField(
        verbose_name=_("Predefined LTI provider"),
        max_length=50,
        null=True,
        blank=True,
        choices=lazy(lambda: PREDEFINED_LTI_PROVIDERS, tuple)(),
        help_text=_("Please choose a predefined provider or fill fields below."),
    )
    oauth_consumer_key = models.CharField(max_length=50, null=True, blank=True)
    shared_secret = models.CharField(max_length=50, null=True, blank=True)
    is_automatic_resizing = models.BooleanField(default=True, blank=True)
    inline_ratio = models.FloatField(
        default=0.5625,  # default is 16/9
        blank=True,
        validators=[MinValueValidator(0.1), MaxValueValidator(10)],
    )

    # pylint: disable=signature-differs
    def save(self, *args, **kwargs):
        """
        Initialize the url attribute if a predefined provider is used.
        """
        lti_provider = self.lti_provider

        if lti_provider and not self.url:
            is_regex = lti_provider.get("is_base_url_regex")
            base_url = lti_provider.get("base_url", "")
            if is_regex:
                self.url = str(exrex.getone(base_url))
            else:
                self.url = base_url

        super().save(*args, **kwargs)

    @property
    def lti_provider(self):
        """
        Returns current predefined LTI provider settings
        """
        return getattr(settings, "RICHIE_LTI_PROVIDERS", {}).get(
            self.lti_provider_id, {}
        )

    def get_inline_ratio_percentage(self):
        """
        Returns actual value to use for `inline_ratio` setting as a percentage
        """
        return 100 * (
            self.lti_provider.get("inline_ratio", 0.5625)
            if self.lti_provider_id
            else self.inline_ratio
        )

    def get_resource_link_id(self):
        """Use the plugin id as resource_link_id field."""
        return str(self.id)

    def get_content_parameters(self, edit=False):
        """
        Convenient wrapper to authorize and return required parameters
        for LTI content consumption
        """
        role = INSTRUCTOR if edit else STUDENT
        site = get_current_site()

        lti_parameters = {
            "context_id": site.domain,
            "launch_presentation_locale": translation.get_language(),
            "lti_message_type": "basic-lti-launch-request",
            "lis_person_contact_email_primary": "",
            "lti_version": "LTI-1p0",
            "resource_link_id": self.get_resource_link_id(),
            "roles": role,
            "user_id": "richie",
        }

        # Get credentials from the predefined LTI provider if any, or from the model otherwise
        oauth_consumer_key = (
            self.lti_provider.get("oauth_consumer_key", "")
            if self.lti_provider_id
            else self.oauth_consumer_key
        )
        shared_secret = (
            self.lti_provider.get("shared_secret", "")
            if self.lti_provider_id
            else self.shared_secret
        )
        client = oauth1.Client(
            client_key=oauth_consumer_key, client_secret=shared_secret
        )
        _uri, headers, _body = client.sign(
            self.url,
            http_method="POST",
            body=lti_parameters,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        oauth_dict = dict(
            param.strip().replace('"', "").split("=")
            for param in headers["Authorization"].split(",")
        )
        oauth_dict["oauth_signature"] = unquote(oauth_dict["oauth_signature"])
        oauth_dict["oauth_nonce"] = oauth_dict.pop("OAuth oauth_nonce")

        oauth_dict.update(lti_parameters)
        return oauth_dict

    def __str__(self):
        return self.url
