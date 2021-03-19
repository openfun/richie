"""LTI Consumer plugin forms."""
import re

from django import forms
from django.conf import settings
from django.utils.translation import gettext_lazy as _

import exrex

from .models import LTIConsumer


class LTIConsumerForm(forms.ModelForm):
    """Plugin form used to add a LTI provided content"""

    class Meta:
        """Form meta attributes"""

        model = LTIConsumer
        fields = [
            "lti_provider_id",
            "url",
            "oauth_consumer_key",
            "shared_secret",
        ]

    def clean(self):
        """
        This form can be filled in two ways:
        - use a predefined LTI provider by filling lti_provider_id field
        - use a custom LTI provider by filling others fields

        Here we're adding related errors
        """
        provider_id = self.cleaned_data.get("lti_provider_id")
        url = self.cleaned_data.get("url")

        if provider_id:
            if url:
                provider = getattr(settings, "RICHIE_LTI_PROVIDERS", {}).get(
                    provider_id, {}
                )
                is_regex = provider.get("is_base_url_regex", True)
                base_url = provider.get("base_url", "")

                if is_regex and not re.compile(base_url).search(url):
                    message = _(
                        'The url is not valid for this provider. It should be of the form "{:s}".'
                    ).format(exrex.getone(base_url))
                    self.add_error("url", message)

                if not is_regex and base_url not in url:
                    message = _(
                        'The url is not valid for this provider. It should start with "{:s}".'
                    ).format(base_url)
                    self.add_error("url", message)

            # Reset credentials
            self.cleaned_data["oauth_consumer_key"] = None
            self.cleaned_data["shared_secret"] = None
        else:
            oauth_consumer_key = self.cleaned_data.get("oauth_consumer_key")
            shared_secret = self.cleaned_data.get("shared_secret")

            if not url and not oauth_consumer_key and not shared_secret:
                self.add_error(
                    "lti_provider_id",
                    _("Please choose a predefined provider, or fill fields below"),
                )
                message = _(
                    "Please choose a predefined provider above, or fill this field"
                )
                self.add_error("url", message)
                self.add_error("oauth_consumer_key", message)
                self.add_error("shared_secret", message)
            else:
                message = _("Please fill this field")
                if not url:
                    self.add_error("url", message)
                if not oauth_consumer_key:
                    self.add_error("oauth_consumer_key", message)
                if not shared_secret:
                    self.add_error("shared_secret", message)

        return super().clean()
