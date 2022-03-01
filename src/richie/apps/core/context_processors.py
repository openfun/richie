"""
Template context processors
"""
import json
from collections import OrderedDict

from django.conf import settings
from django.contrib.sites.models import Site
from django.core.files.storage import get_storage_class
from django.http.request import HttpRequest
from django.middleware.csrf import get_token
from django.utils.translation import get_language_from_request

from richie.apps.core.templatetags.joanie import is_joanie_enabled
from richie.apps.courses.defaults import RICHIE_MAX_ARCHIVED_COURSE_RUNS
from richie.apps.courses.models import Organization

from . import defaults


def site_metas(request: HttpRequest):
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
                **WebAnalyticsContextProcessor().frontend_context_processor(request),
            }
        },
        **WebAnalyticsContextProcessor().context_processor(request),
    }

    if getattr(settings, "CDN_DOMAIN", None):
        context["CDN_DOMAIN"] = settings.CDN_DOMAIN

    storage_url = get_storage_class()().url("any-page")
    # Add a MEDIA_URL_PREFIX to context to prefix the media url files to have an absolute URL
    if storage_url.startswith("//"):
        # Eg. //my-cdn-user.cdn-provider.com/media/
        context["MEDIA_URL_PREFIX"] = f"{request.scheme:s}:"
    elif storage_url.startswith("/"):
        # Eg. /media/
        context["MEDIA_URL_PREFIX"] = f"{protocol:s}://{site_current.domain:s}"
    else:
        # Eg. https://my-cdn-user.cdn-provider.com/media/
        context["MEDIA_URL_PREFIX"] = ""

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

    if is_joanie_enabled():
        context["FRONTEND_CONTEXT"]["context"]["joanie_backend"] = {
            "endpoint": settings.JOANIE["BASE_URL"],
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

    if getattr(settings, "RICHIE_MINIMUM_COURSE_RUNS_ENROLLMENT_COUNT", None):
        context[
            "RICHIE_MINIMUM_COURSE_RUNS_ENROLLMENT_COUNT"
        ] = settings.RICHIE_MINIMUM_COURSE_RUNS_ENROLLMENT_COUNT

    context["RICHIE_MAX_ARCHIVED_COURSE_RUNS"] = getattr(
        settings, "RICHIE_MAX_ARCHIVED_COURSE_RUNS", RICHIE_MAX_ARCHIVED_COURSE_RUNS
    )

    return context


class WebAnalyticsContextProcessor:
    """
    Context processor to add Web Analytics tracking information to Richie CMS templates and
    frontend.
    """

    # pylint: disable=no-self-use
    def frontend_context_processor(self, request: HttpRequest) -> dict:
        """
        Additional web analytics information for the frontend react
        """
        context = {}
        if getattr(settings, "WEB_ANALYTICS_ID", None):
            context["web_analytics_provider"] = getattr(
                settings, "WEB_ANALYTICS_PROVIDER", "google_analytics"
            )
        return context

    def context_processor(self, request: HttpRequest) -> dict:
        """
        Real implementation of the context processor for the Web Analytics core app sub-module
        """
        context = {}
        if hasattr(request, "current_page"):
            # load web analytics settings to the context
            if getattr(settings, "WEB_ANALYTICS_ID", None):
                context["WEB_ANALYTICS_ID"] = settings.WEB_ANALYTICS_ID
                context["WEB_ANALYTICS_DIMENSIONS"] = self.get_dimensions(request)

            context["WEB_ANALYTICS_LOCATION"] = getattr(
                settings, "WEB_ANALYTICS_LOCATION", "head"
            )

            context["WEB_ANALYTICS_PROVIDER"] = getattr(
                settings, "WEB_ANALYTICS_PROVIDER", "google_analytics"
            )
        return context

    # pylint: disable=no-self-use
    def get_dimensions(self, request: HttpRequest) -> dict:
        """
        Compute the web analytics dimensions (dict) that would be added to the Django context
        They are a dictionary like:
        ```
        {
            "organizations_codes": ["UNIV_LISBON", "UNIV_PORTO"],
            "course_code": ["COURSE_XPTO"],
            "course_runs_titles": [
                "Summer edition",
                "Winter edition"
            ],
            "course_runs_resource_links": [
                "http://example.edx:8073/courses/course-v1:edX+DemoX+Demo_Course/info",
                "http://example.edx:8073/courses/course-v1:edX+DemoX+Demo_Course_2/info"
            ],
            "page_title": ["Introduction to Programming"],
        }
        ```

        Args:
            request (HttpRequest): The Http request
            web_analytics_context (dict): the context relevant for the web analytics sub module

        Returns:
            dict: a dict with the dimensions, where each value is a list
        """
        # Warn do not change the order of evaluation of this methods, because on Google Analytics
        # the key is a 'dimension1' instead of a more generic key like 'organizations'.
        # That's why we are using an OrderedDict instead of a normal Python dict (don't support
        # ordering)
        dimensions = OrderedDict()

        page = request.current_page or None
        language = get_language_from_request(request, check_path=True)

        organizations_codes = []
        if page and not page.is_home:
            organizations_codes = Organization.get_organizations_codes(page, language)
        dimensions["organizations_codes"] = organizations_codes

        course = getattr(page, "course", None)
        dimensions["course_code"] = [getattr(course, "code", "")]

        course_runs = course.course_runs if course else []
        dimensions["course_runs_titles"] = [
            course_run.title
            for course_run in course_runs
            if course_run is not None and course_run.safe_title is not None
        ]

        dimensions["course_runs_resource_links"] = map(
            lambda course_run: course_run.resource_link, course_runs
        )

        dimensions["page_title"] = [page.get_title() if page else ""]
        return dimensions
