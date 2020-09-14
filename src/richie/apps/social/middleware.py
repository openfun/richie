"""middlewares used with python social auth."""
from django.conf import settings

from cms.models import Page
from cms.utils import get_language_from_request

from social_django.middleware import (  # isort:skip
    SocialAuthExceptionMiddleware as BaseSocialAuthExceptionMiddleware,
)

SOCIAL_ERROR_REVERSE_ID = getattr(settings, "SOCIAL_ERROR_REVERSE_ID", None)


class SocialAuthExceptionMiddleware(BaseSocialAuthExceptionMiddleware):
    """Middleware extending social-auth middleware, overriding get_redirect_uri."""

    def get_redirect_uri(self, request, exception):
        """
        Check if an error page exists and returns its url. Fallback on parent function otherwise.
        """
        try:
            page = Page.objects.get(reverse_id=SOCIAL_ERROR_REVERSE_ID)
        except Page.DoesNotExist:
            return super.get_redirect_uri(request, exception)
        else:
            return page.get_absolute_url(language=get_language_from_request(request))
