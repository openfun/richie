"""
LTI consumer plugin models
"""
from urllib.parse import unquote

from django.conf import settings
from django.db import models
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

    # pylint: disable=signature-differs
    def save(self, *args, **kwargs):
        """
        Initialize attributes :
        - context_id from current site domain
        - url if predefined provider is used
        """
        if not self.id:
            if self.lti_provider and not self.url:
                if self.lti_provider.get("is_base_url_regex"):
                    self.url = "{:s}".format(
                        exrex.getone(self.lti_provider.get("base_url", "")),
                    )
                else:
                    self.url = self.lti_provider.get("base_url", "")
        super().save(*args, **kwargs)

    @property
    def lti_provider(self):
        """
        Returns current predefined LTI provider settings
        """
        return getattr(settings, "RICHIE_LTI_PROVIDERS", {}).get(
            self.lti_provider_id, {}
        )

    @property
    def automatic_resizing(self):
        """
        Returns current predefined LTI provider automatic_resizing setting
        """
        return self.lti_provider.get("automatic_resizing", False)

    @property
    def inline_ratio(self):
        """
        Returns current predefined LTI provider inline_ratio setting
        """
        return self.lti_provider.get("inline_ratio", 0)

    @property
    def inline_ratio_css_padding_bottom(self):
        """
        Returns current predefined LTI provider inline_ratio css style
        """
        return f"padding-bottom: {self.inline_ratio * 100}%"

    def auth_parameters(self, edit=False):
        """
        Builds required parameters for LTI authentication
        """
        role = INSTRUCTOR if edit else STUDENT
        site = get_current_site()
        return {
            "lti_message_type": self.lti_provider.get(
                "display_name", self.lti_provider_id
            ),
            "lti_version": "LTI-1p0",
            "resource_link_id": str(self.id),
            "context_id": site.domain,
            "user_id": "richie",
            "lis_person_contact_email_primary": "",
            "roles": role,
        }

    def authorize(self):
        """
        Returns headers from LTI authentication
        """
        client = oauth1.Client(
            client_key=self.lti_provider.get("oauth_consumer_key"),
            client_secret=self.lti_provider.get("shared_secret"),
        )

        _uri, headers, _body = client.sign(
            self.url,
            http_method="POST",
            body=self.auth_parameters(),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        return headers

    def build_content_parameters(self, auth_headers, edit=False):
        """
        Builds required parameters for LTI content consumption
        """
        oauth_dict = dict(
            param.strip().replace('"', "").split("=")
            for param in auth_headers["Authorization"].split(",")
        )
        signature = oauth_dict["oauth_signature"]
        oauth_dict["oauth_signature"] = unquote(signature)
        oauth_dict["oauth_nonce"] = oauth_dict.pop("OAuth oauth_nonce")

        oauth_dict.update(self.auth_parameters(edit=edit))
        return oauth_dict

    def content_parameters(self, edit=False):
        """
        Convenient wrapper to authorize and return required parameters
        for LTI content consumption
        """
        return self.build_content_parameters(self.authorize(), edit=edit)

    def __str__(self):
        return self.url
