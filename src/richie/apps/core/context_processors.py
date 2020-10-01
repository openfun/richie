"""
Template context processors
"""
import json

from django.conf import settings
from django.contrib.sites.models import Site
from django.middleware.csrf import get_token

from . import defaults


def site_metas(request):
    """
    Context processor to add all information required by Richie CMS templates and frontend.

    If `CDN_DOMAIN` settings is defined we add it in the context. It allows
    to load statics js on a CDN like cloudfront.
    """
    site_current = Site.objects.get_current()
    protocol = "https" if request.is_secure() else "http"
    authentication_delegation = getattr(settings, "AUTHENTICATION_DELEGATION", {})
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
        "AUTHENTICATION": {
            "PROFILE_URLS": json.dumps(
                [
                    {
                        "label": str(url["label"]),
                        "action": str(
                            url["href"].format(
                                base_url=authentication_delegation["BASE_URL"]
                            )
                        ),
                    }
                    for url in authentication_delegation["PROFILE_URLS"]
                ]
            ),
        },
        "FRONTEND_CONTEXT": json.dumps(
            {
                "context": {
                    "csrftoken": get_token(request),
                    "environment": getattr(settings, "ENVIRONMENT", ""),
                    "release": getattr(settings, "RELEASE", ""),
                    "sentry_dsn": getattr(settings, "SENTRY_DSN", ""),
                    "authentication": {
                        "endpoint": authentication_delegation["BASE_URL"],
                        "backend": authentication_delegation["BACKEND"],
                    },
                    "lms_backends": [
                        {
                            "endpoint": lms["BASE_URL"],
                            "backend": lms["BACKEND"],
                            "course_regexp": lms["JS_COURSE_REGEX"],
                            "selector_regexp": lms["JS_SELECTOR_REGEX"],
                        }
                        for lms in getattr(settings, "LMS_BACKENDS", [])
                    ],
                }
            }
        ),
    }
    if getattr(settings, "CDN_DOMAIN", False):
        context["CDN_DOMAIN"] = settings.CDN_DOMAIN

    return context
