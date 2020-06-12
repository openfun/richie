"""
Template context processors
"""
import json

from django.conf import settings
from django.contrib.sites.models import Site

from . import defaults


def site_metas(request):
    """
    Context processor to add all information required by Richie CMS templates and frontend.

    If `CDN_DOMAIN` settings is defined we add it in the context. It allows
    to load statics js on a CDN like cloudfront.
    """
    site_current = Site.objects.get_current()
    protocol = "https" if request.is_secure() else "http"
    context = {
        **{
            f"GLIMPSE_PAGINATION_{k.upper()}": v
            for k, v in {
                **defaults.GLIMPSE_PAGINATION,
                **getattr(settings, "RICHIE_GLIMPSE_PAGINATION", {}),
            }.items()
        },
        "SITE": {
            "name": site_current.name,
            "domain": site_current.domain,
            "web_url": f"{protocol:s}://{site_current.domain:s}",
        },
        "FRONTEND_CONTEXT": json.dumps(
            {
                "context": {
                    "environment": getattr(settings, "ENVIRONMENT", ""),
                    "release": getattr(settings, "RELEASE", ""),
                    "sentry_dsn": getattr(settings, "SENTRY_DSN", ""),
                }
            }
        ),
    }
    if getattr(settings, "CDN_DOMAIN", False):
        context["CDN_DOMAIN"] = settings.CDN_DOMAIN

    return context
