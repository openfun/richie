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
        "FRONTEND_CONTEXT": {
            "context": {
                "csrftoken": get_token(request),
                "environment": getattr(settings, "ENVIRONMENT", ""),
                "release": getattr(settings, "RELEASE", ""),
                "sentry_dsn": getattr(settings, "SENTRY_DSN", ""),
            }
        },
    }

    if getattr(settings, "CDN_DOMAIN", None):
        context["CDN_DOMAIN"] = settings.CDN_DOMAIN

    authentication_delegation = getattr(
        settings, "RICHIE_AUTHENTICATION_DELEGATION", None
    )
    if authentication_delegation:

        context["AUTHENTICATION"] = {
            "profile_urls": json.dumps(
                {
                    key: {
                        "label": str(url["label"]),
                        "action": str(
                            url["href"].format(
                                base_url=authentication_delegation["BASE_URL"]
                            )
                        ),
                    }
                    for key, url in authentication_delegation.get(
                        "PROFILE_URLS", {}
                    ).items()
                }
            ),
        }

        context["FRONTEND_CONTEXT"]["context"]["authentication"] = {
            "endpoint": authentication_delegation["BASE_URL"],
            "backend": authentication_delegation["BACKEND"],
        }

    if getattr(settings, "RICHIE_LMS_BACKENDS", None):
        context["FRONTEND_CONTEXT"]["context"]["lms_backends"] = [
            {
                "endpoint": lms["BASE_URL"],
                "backend": lms["JS_BACKEND"],
                "course_regexp": lms["JS_COURSE_REGEX"],
            }
            for lms in getattr(settings, "RICHIE_LMS_BACKENDS", [])
        ]

    context["FRONTEND_CONTEXT"] = json.dumps(context["FRONTEND_CONTEXT"])
    return context
