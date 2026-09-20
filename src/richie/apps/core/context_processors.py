"""
Template context processors
"""

import json
import logging
from collections import OrderedDict
from urllib.parse import quote, urlparse

from django.conf import settings
from django.contrib.sites.models import Site
from django.core.exceptions import ImproperlyConfigured
from django.core.files.storage import get_storage_class
from django.http.request import HttpRequest
from django.utils.translation import get_language_from_request

from cms.models import Page

from richie.apps.core.templatetags.joanie import is_joanie_enabled
from richie.apps.courses.models import Organization

from . import defaults

logger = logging.getLogger(__name__)


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
        "FRONTEND_CONTEXT": json.dumps(
            FrontendContextProcessor().context_processor(request)
        ),
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

    # Performance configurations
    if urlparse(storage_url).hostname:
        # Use dns-prefetch when using external media host, like a CDN.
        context["MEDIA_URL_IS_EXTERNAL"] = True
        # Optionally preconnect to the CDN
        context["MEDIA_HOSTNAME_PRECONNECT"] = getattr(
            settings, "MEDIA_HOSTNAME_PRECONNECT", False
        )

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
        if authentication_delegation["BACKEND"] in ["keycloak", "fonzie-keycloak"]:
            profile_urls = json.loads(context["AUTHENTICATION"]["profile_urls"])
            # Override the default account profile url with the one from the keycloak realm
            account_url = (
                f"{authentication_delegation['KEYCLOAK_BASE_URL']}"
                f"/realms/{authentication_delegation['KEYCLOAK_REALM']}/account/"
                f"?referrer={authentication_delegation['KEYCLOAK_CLIENT_ID']}"
                f"&referrer_uri={quote(request.build_absolute_uri(), safe='')}"
            )
            profile_urls["account"]["action"] = account_url
            if authentication_delegation["BACKEND"] == "keycloak":
                profile_urls.pop("profile", None)
            context["AUTHENTICATION"]["profile_urls"] = json.dumps(profile_urls)

    if getattr(settings, "RICHIE_MINIMUM_COURSE_RUNS_ENROLLMENT_COUNT", None):
        context["RICHIE_MINIMUM_COURSE_RUNS_ENROLLMENT_COUNT"] = (
            settings.RICHIE_MINIMUM_COURSE_RUNS_ENROLLMENT_COUNT
        )

    context["RICHIE_VIDEO_PLUGIN_LAZY_LOADING"] = getattr(
        settings, "RICHIE_VIDEO_PLUGIN_LAZY_LOADING", False
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
        if getattr(settings, "WEB_ANALYTICS", None):
            context["web_analytics_providers"] = json.dumps(
                list(getattr(settings, "WEB_ANALYTICS", {}).keys())
            )
        return context

    def context_processor(self, request: HttpRequest) -> dict:
        """
        Real implementation of the context processor for the Web Analytics core app sub-module
        """
        context = {}
        if hasattr(request, "current_page"):
            # load web analytics settings to the context
            if getattr(settings, "WEB_ANALYTICS", None):
                context["WEB_ANALYTICS"] = settings.WEB_ANALYTICS
                context["WEB_ANALYTICS_DIMENSIONS"] = self.get_dimensions(request)
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


class FrontendContextProcessor:
    """
    Context processor to add all information required by react application.
    """

    def get_authentication_context(self):
        """Get the authentication context if there is."""
        context = None
        if authentication_delegation := getattr(
            settings, "RICHIE_AUTHENTICATION_DELEGATION", None
        ):
            context = {
                "endpoint": authentication_delegation["BASE_URL"],
                "backend": authentication_delegation["BACKEND"],
            }
            if authentication_delegation["BACKEND"] in ["keycloak", "fonzie-keycloak"]:
                context["keycloak_endpoint"] = authentication_delegation[
                    "KEYCLOAK_BASE_URL"
                ]
                context["keycloak_client_id"] = authentication_delegation[
                    "KEYCLOAK_CLIENT_ID"
                ]
                context["keycloak_realm"] = authentication_delegation["KEYCLOAK_REALM"]

        return context

    def get_joanie_context(self):
        """Get the joanie context if it is enabled."""
        if is_joanie_enabled():
            return {
                "endpoint": settings.JOANIE_BACKEND["BASE_URL"],
            }

        return None

    def get_lms_context(self):
        """Get lms backends context if there are."""
        if getattr(settings, "RICHIE_LMS_BACKENDS", None):
            result = []
            for lms in getattr(settings, "RICHIE_LMS_BACKENDS", []):
                entry = {
                    "endpoint": lms["BASE_URL"],
                    "backend": lms["JS_BACKEND"],
                    "course_regexp": lms["JS_COURSE_REGEX"],
                }
                if "JS_NEXT_URL" in lms:
                    entry["next_url"] = lms["JS_NEXT_URL"]
                result.append(entry)
            return result

        return None

    ENROLLMENT_AWARENESS_CONDITIONS = {
        "offer": list,
        "certificate_offer": list,
        "languages": list,
        "is_external": bool,
    }
    ENROLLMENT_AWARENESS_MESSAGE_VARIANTS = ("info", "warning")

    def get_enrollment_awareness_rules(self):
        """
        Get the enrollment awareness rules context if there are.

        Rules are configured with the `RICHIE_ENROLLMENT_AWARENESS_RULES` setting. Each rule is
        a dictionary with:
        - "id": a unique string identifying the rule,
        - "when": a dictionary of conditions on the course run, using the vocabulary defined in
          `ENROLLMENT_AWARENESS_CONDITIONS`. All conditions of a rule must match,
        - "cta" (optional): a dictionary with the "enroll" and/or "login" labels replacing the
          default labels of the enrollment call to action,
        - "message" (optional): a dictionary with a "variant" ("info" or "warning") and a
          "text" displayed next to the call to action.

        Labels and texts can be lazy translation strings: they are rendered in the language of
        the current request when serialized to the frontend context.

        Raises ImproperlyConfigured if the setting is malformed, so that a broken configuration
        is noticed as soon as a page is rendered.
        """
        rules = getattr(settings, "RICHIE_ENROLLMENT_AWARENESS_RULES", None)
        if not rules:
            return None

        result = []
        seen_ids = set()
        for index, rule in enumerate(rules):
            entry = self._serialize_enrollment_awareness_rule(index, rule)
            if entry["id"] in seen_ids:
                raise ImproperlyConfigured(
                    f"RICHIE_ENROLLMENT_AWARENESS_RULES[{index:d}] has a duplicate "
                    f'"id": {entry["id"]:s}.'
                )
            seen_ids.add(entry["id"])
            result.append(entry)

        return result

    def _serialize_enrollment_awareness_rule(self, index, rule):
        """Validate one enrollment awareness rule and serialize it for the frontend."""
        prefix = f"RICHIE_ENROLLMENT_AWARENESS_RULES[{index:d}]"
        if not isinstance(rule, dict):
            raise ImproperlyConfigured(f"{prefix} must be a dictionary.")

        rule_id = rule.get("id")
        if not isinstance(rule_id, str) or not rule_id:
            raise ImproperlyConfigured(f'{prefix} must have a non-empty string "id".')

        entry = {
            "id": rule_id,
            "when": self._validate_enrollment_awareness_conditions(
                prefix, rule.get("when")
            ),
        }

        cta = rule.get("cta")
        message = rule.get("message")
        if cta is None and message is None:
            raise ImproperlyConfigured(
                f'{prefix} must define at least a "cta" or a "message".'
            )

        if cta is not None:
            if not isinstance(cta, dict) or not cta:
                raise ImproperlyConfigured(
                    f'{prefix} "cta" must be a non-empty dictionary.'
                )
            if set(cta) - {"enroll", "login"}:
                raise ImproperlyConfigured(
                    f'{prefix} "cta" only accepts the "enroll" and "login" keys.'
                )
            entry["cta"] = {key: str(value) for key, value in cta.items()}

        if message is not None:
            if (
                not isinstance(message, dict)
                or message.get("variant")
                not in self.ENROLLMENT_AWARENESS_MESSAGE_VARIANTS
                or not message.get("text")
            ):
                raise ImproperlyConfigured(
                    f'{prefix} "message" must be a dictionary with a "variant" '
                    f"({' or '.join(self.ENROLLMENT_AWARENESS_MESSAGE_VARIANTS):s}) "
                    'and a non-empty "text".'
                )
            entry["message"] = {
                "variant": message["variant"],
                "text": str(message["text"]),
            }

        return entry

    def _validate_enrollment_awareness_conditions(self, prefix, when):
        """Validate the "when" conditions of an enrollment awareness rule."""
        if not isinstance(when, dict) or not when:
            raise ImproperlyConfigured(
                f'{prefix} must have a non-empty "when" dictionary.'
            )

        for condition, value in when.items():
            expected_type = self.ENROLLMENT_AWARENESS_CONDITIONS.get(condition)
            if expected_type is None:
                raise ImproperlyConfigured(
                    f'{prefix} has an unknown condition "{condition:s}". Known conditions '
                    f"are: {', '.join(self.ENROLLMENT_AWARENESS_CONDITIONS):s}."
                )
            if not isinstance(value, expected_type) or (
                expected_type is list and not value
            ):
                raise ImproperlyConfigured(
                    f'{prefix} condition "{condition:s}" must be a non-empty '
                    f"{expected_type.__name__:s}."
                )

        return when

    def get_site_urls(self, request: HttpRequest):
        """Get the site urls context that must be passed down to react application."""

        def get_page_url(reverse_id):
            try:
                page = Page.objects.get(publisher_is_draft=False, reverse_id=reverse_id)
            except Page.DoesNotExist:
                return None

            return page.get_public_url()

        return {"terms_and_conditions": get_page_url("annex__terms_and_conditions")}

    def context_processor(self, request: HttpRequest) -> dict:
        """Get the frontend context processor."""
        context = {
            "environment": getattr(settings, "ENVIRONMENT", ""),
            "release": getattr(settings, "RELEASE", ""),
            "sentry_dsn": getattr(settings, "SENTRY_DSN", ""),
            "features": getattr(settings, "FEATURES", {}),
            "site_urls": self.get_site_urls(request),
            **WebAnalyticsContextProcessor().frontend_context_processor(request),
        }

        if authentication_context := self.get_authentication_context():
            context["authentication"] = authentication_context

        if joanie_context := self.get_joanie_context():
            context["joanie_backend"] = joanie_context

        if lms_context := self.get_lms_context():
            context["lms_backends"] = lms_context

        if enrollment_awareness_rules := self.get_enrollment_awareness_rules():
            context["enrollment_awareness_rules"] = enrollment_awareness_rules

        return {"context": context}
