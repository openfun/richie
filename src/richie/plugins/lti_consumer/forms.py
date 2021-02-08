"""LTI Consumer plugin forms."""
from django import forms
from django.utils.translation import gettext_lazy as _

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
        if not self.cleaned_data.get("lti_provider_id"):
            missing_url = not self.cleaned_data.get("url")
            missing_oauth_consumer_key = not self.cleaned_data.get("oauth_consumer_key")
            missing_shared_secret = not self.cleaned_data.get("shared_secret")

            if missing_url and missing_oauth_consumer_key and missing_shared_secret:
                self.add_error(
                    "lti_provider_id",
                    _("Please choose a predefined provider, or fill fields below"),
                )
                error_message = _(
                    "Please choose a predefined provider above, or fill this field"
                )
                self.add_error("url", error_message)
                self.add_error("oauth_consumer_key", error_message)
                self.add_error("shared_secret", error_message)
            else:
                error_message = _("Please fill this field")
                if missing_url:
                    self.add_error("url", error_message)
                if missing_oauth_consumer_key:
                    self.add_error("oauth_consumer_key", error_message)
                if missing_shared_secret:
                    self.add_error("shared_secret", error_message)
        return super().clean()
