"""
Django settings for richie project.
"""
import json
import os

from django.utils.translation import gettext_lazy as _

# pylint: disable=ungrouped-imports
import sentry_sdk
from configurations import Configuration, values
from sentry_sdk.integrations.django import DjangoIntegration

from richie.apps.courses.settings.mixins import RichieCoursesConfigurationMixin

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join("/", "data")


def get_release():
    """Get the current release of the application.

    By release, we mean the release from the version.json file à la Mozilla [1]
    (if any). If this file has not been found, it defaults to "NA".

    [1]
    https://github.com/mozilla-services/Dockerflow/blob/master/docs/version_object.md
    """
    # Try to get the current release from the version.json file generated by the
    # CI during the Docker image build
    try:
        with open(os.path.join(BASE_DIR, "version.json"), encoding="utf8") as version:
            return json.load(version)["version"]
    except FileNotFoundError:
        return "NA"  # Default: not available


class StyleguideMixin:
    """
    Theme styleguide reference

    Only used to build styleguide page without to hardcode properties and
    values into styleguide template.
    """

    STYLEGUIDE = {
        # Available font family names
        "fonts": ["hind", "montserrat"],
        # Named color palette
        "palette": [
            "black",
            "dark-grey",
            "charcoal",
            "slate-grey",
            "battleship-grey",
            "light-grey",
            "silver",
            "azure2",
            "smoke",
            "white",
            "denim",
            "firebrick6",
            "grey32",
            "grey59",
            "grey87",
            "purplish-grey",
            "midnightblue",
            "indianred3",
        ],
        # Available gradient background
        "gradient_colors": [
            "neutral-gradient",
            "middle-gradient",
            "dark-gradient",
            "white-mask-gradient",
        ],
        # Available color schemes
        "schemes": [
            "primary",
            "secondary",
            "tertiary",
            "clear",
            "light",
            "lightest",
            "neutral-gradient",
            "middle-gradient",
            "dark-gradient",
            "white-mask-gradient",
            "transparent-darkest",
            "clouds",
            "waves",
            "purplish-grey",
            "battleship-grey",
        ],
    }


class DRFMixin:
    """
    Django Rest Framework configuration mixin.
    NB: DRF picks its settings from the REST_FRAMEWORK namespace on the settings, hence
    the nesting of all our values inside that prop
    """

    REST_FRAMEWORK = {
        "ALLOWED_VERSIONS": ("1.0",),
        "DEFAULT_AUTHENTICATION_CLASSES": (
            "rest_framework.authentication.SessionAuthentication",
        ),
        "DEFAULT_VERSION": "1.0",
        "DEFAULT_VERSIONING_CLASS": "rest_framework.versioning.URLPathVersioning",
    }


class Base(StyleguideMixin, DRFMixin, RichieCoursesConfigurationMixin, Configuration):
    """
    This is the base configuration every configuration (aka environnement) should inherit from. It
    is recommended to configure third-party applications by creating a configuration mixins in
    ./configurations and compose the Base configuration with those mixins.

    It depends on an environment variable that SHOULD be defined:

    * DJANGO_SECRET_KEY

    You may also want to override default configuration by setting the following environment
    variables:

    * DJANGO_SENTRY_DSN
    * RICHIE_ES_HOST
    * DB_NAME
    * DB_HOST
    * DB_PASSWORD
    * DB_USER
    """

    DEBUG = False

    SITE_ID = 1

    # Security
    ALLOWED_HOSTS = []
    SECRET_KEY = values.Value("ThisIsAnExampleKeyForDevPurposeOnly")
    # System check reference:
    # https://docs.djangoproject.com/en/2.2/ref/checks/#security
    SILENCED_SYSTEM_CHECKS = values.ListValue(
        [
            # Allow the X_FRAME_OPTIONS to be set to "SAMEORIGIN"
            "security.W019"
        ]
    )
    # The X_FRAME_OPTIONS value should be set to "SAMEORIGIN" to display
    # DjangoCMS frontend admin frames. Dockerflow raises a system check security
    # warning with this setting, one should add "security.W019" to the
    # SILENCED_SYSTEM_CHECKS setting (see above).
    X_FRAME_OPTIONS = "SAMEORIGIN"

    # Application definition
    ROOT_URLCONF = "urls"
    WSGI_APPLICATION = "wsgi.application"

    # Database
    DATABASES = {
        "default": {
            "ENGINE": values.Value(
                "django.db.backends.postgresql_psycopg2",
                environ_name="DB_ENGINE",
                environ_prefix=None,
            ),
            "NAME": values.Value("richie", environ_name="DB_NAME", environ_prefix=None),
            "USER": values.Value("fun", environ_name="DB_USER", environ_prefix=None),
            "PASSWORD": values.Value(
                "pass", environ_name="DB_PASSWORD", environ_prefix=None
            ),
            "HOST": values.Value(
                "localhost", environ_name="DB_HOST", environ_prefix=None
            ),
            "PORT": values.Value(5432, environ_name="DB_PORT", environ_prefix=None),
        }
    }
    MIGRATION_MODULES = {}

    # Static files (CSS, JavaScript, Images)
    STATIC_URL = "/static/"
    MEDIA_URL = "/media/"
    MEDIA_ROOT = os.path.join(DATA_DIR, "media")
    STATIC_ROOT = os.path.join(DATA_DIR, "static")

    # Login/registration related settings
    LOGIN_REDIRECT_URL = "/"
    LOGOUT_REDIRECT_URL = "/"
    LOGIN_URL = "login"
    LOGOUT_URL = "logout"

    AUTHENTICATION_BACKENDS = (
        "richie.apps.social.backends.EdXOAuth2",
        "richie.apps.social.backends.EdXOIDC",
        "django.contrib.auth.backends.ModelBackend",
    )

    # Social auth
    SOCIAL_AUTH_EDX_OAUTH2_KEY = values.Value()
    SOCIAL_AUTH_EDX_OAUTH2_SECRET = values.Value()
    SOCIAL_AUTH_EDX_OAUTH2_ENDPOINT = values.Value()
    SOCIAL_AUTH_EDX_OIDC_KEY = values.Value()
    SOCIAL_AUTH_EDX_OIDC_SECRET = values.Value()
    SOCIAL_AUTH_EDX_OIDC_ID_TOKEN_DECRYPTION_KEY = values.Value()
    SOCIAL_AUTH_EDX_OIDC_ENDPOINT = values.Value()
    SOCIAL_AUTH_POSTGRES_JSONFIELD = False  # Mysql compatibility by default

    SOCIAL_AUTH_PIPELINE = (
        # Get the information we can about the user and return it in a simple
        # format to create the user instance later. In some cases the details are
        # already part of the auth response from the provider, but sometimes this
        # could hit a provider API.
        "social_core.pipeline.social_auth.social_details",
        # Get the social uid from whichever service we're authing thru. The uid is
        # the unique identifier of the given user in the provider.
        "social_core.pipeline.social_auth.social_uid",
        # Verifies that the current auth process is valid within the current
        # project, this is where emails and domains whitelists are applied (if
        # defined).
        "social_core.pipeline.social_auth.auth_allowed",
        # Checks if the current social-account is already associated in the site.
        "social_core.pipeline.social_auth.social_user",
        # Make up a username for this person.
        "richie.apps.social.pipeline.user.get_username",
        # Create a user account if we haven't found one yet.
        "social_core.pipeline.user.create_user",
        # Create the record that associates the social account with the user.
        "social_core.pipeline.social_auth.associate_user",
        # Populate the extra_data field in the social record with the values
        # specified by settings (and the default ones like access_token, etc).
        "social_core.pipeline.social_auth.load_extra_data",
        # Update the user record with any changed info from the auth service.
        "social_core.pipeline.user.user_details",
    )

    # Mapping between edx and richie profile fields
    EDX_USER_PROFILE_TO_DJANGO = values.DictValue()

    SOCIAL_ERROR_REVERSE_ID = values.Value()

    # AUTHENTICATION
    RICHIE_AUTHENTICATION_DELEGATION = {
        "BASE_URL": values.Value(
            "", environ_name="AUTHENTICATION_BASE_URL", environ_prefix=None
        ),
        "BACKEND": values.Value(
            "base", environ_name="AUTHENTICATION_BACKEND", environ_prefix=None
        ),
        # PROFILE_URLS are custom links to access to Auth profile views
        # from Richie. Link order will reflect the order of display in frontend.
        # (i) Info - {base_url} is RICHIE_AUTHENTICATION_DELEGATION.BASE_URL
        # (i) If you need to bind user data into href url, wrap the property between ()
        # e.g: for user.username = johndoe, /u/(username) will be /u/johndoe
        "PROFILE_URLS": values.DictValue(
            {
                "dashboard": {
                    "label": _("Dashboard"),
                    "href": _("{base_url:s}/dashboard"),
                },
                "profile": {
                    "label": _("Profile"),
                    "href": _("{base_url:s}/u/(username)"),
                },
                "account": {
                    "label": _("Account"),
                    "href": _("{base_url:s}/account/settings"),
                },
            },
            environ_name="AUTHENTICATION_PROFILE_URLS",
            environ_prefix=None,
        ),
    }

    # LMS
    RICHIE_LMS_BACKENDS = [
        {
            # We configure default values that work with the test configuration of
            # github.com/openfun/openedx-docker.
            "BASE_URL": values.Value(environ_name="EDX_BASE_URL", environ_prefix=None),
            # Django backend
            "BACKEND": values.Value(
                "richie.apps.courses.lms.edx.EdXLMSBackend",
                environ_name="EDX_BACKEND",
                environ_prefix=None,
            ),
            "COURSE_REGEX": values.Value(
                r"^.*/courses/(?P<course_id>.*)/course/?$",
                environ_name="EDX_COURSE_REGEX",
                environ_prefix=None,
            ),
            # React frontend
            "JS_BACKEND": values.Value(
                "base", environ_name="EDX_JS_BACKEND", environ_prefix=None
            ),
            "JS_COURSE_REGEX": values.Value(
                r"^.*/courses/(.*)/course/?$",
                environ_name="EDX_JS_COURSE_REGEX",
                environ_prefix=None,
            ),
            # Course runs synchronization
            "COURSE_RUN_SYNC_NO_UPDATE_FIELDS": [],
            "DEFAULT_COURSE_RUN_SYNC_MODE": "sync_to_public",
        }
    ]
    RICHIE_COURSE_RUN_SYNC_SECRETS = values.ListValue([])

    # Elasticsearch
    RICHIE_ES_HOST = values.Value(
        "elasticsearch", environ_name="RICHIE_ES_HOST", environ_prefix=None
    )
    RICHIE_ES_INDICES_PREFIX = values.Value(
        default="richie", environ_name="RICHIE_ES_INDICES_PREFIX", environ_prefix=None
    )
    RICHIE_ES_STATE_WEIGHTS = values.ListValue(None)

    # LTI Content
    RICHIE_LTI_PROVIDERS = {
        "lti_provider_test": {
            "oauth_consumer_key": values.Value(
                "InsecureOauthConsumerKey",
                environ_name="LTI_TEST_OAUTH_CONSUMER_KEY",
                environ_prefix=None,
            ),
            "shared_secret": values.Value(
                "InsecureSharedSecret",
                environ_name="LTI_TEST_SHARED_SECRET",
                environ_prefix=None,
            ),
            "base_url": values.Value(
                "https://lti.tools/saltire/tp",
                environ_name="LTI_TEST_BASE_URL",
                environ_prefix=None,
            ),
            "display_name": "LTI Provider Test Video",
            "is_base_url_regex": False,
            "is_automatic_resizing": True,
            "inline_ratio": 0.5625,
        }
    }

    # Internationalization
    TIME_ZONE = "Europe/Paris"
    USE_I18N = True
    USE_L10N = True
    USE_TZ = True

    # Templates
    TEMPLATES = [
        {
            "BACKEND": "django.template.backends.django.DjangoTemplates",
            "DIRS": [os.path.join(BASE_DIR, "templates")],
            "OPTIONS": {
                "context_processors": [
                    "django.contrib.auth.context_processors.auth",
                    "django.contrib.messages.context_processors.messages",
                    "django.template.context_processors.i18n",
                    "django.template.context_processors.debug",
                    "django.template.context_processors.request",
                    "django.template.context_processors.media",
                    "django.template.context_processors.csrf",
                    "django.template.context_processors.tz",
                    "sekizai.context_processors.sekizai",
                    "django.template.context_processors.static",
                    "cms.context_processors.cms_settings",
                    "richie.apps.core.context_processors.site_metas",
                    "social_django.context_processors.backends",
                    "social_django.context_processors.login_redirect",
                ],
                "loaders": [
                    "django.template.loaders.filesystem.Loader",
                    "django.template.loaders.app_directories.Loader",
                ],
            },
        }
    ]

    MIDDLEWARE = (
        "richie.apps.core.cache.LimitBrowserCacheTTLHeaders",
        "cms.middleware.utils.ApphookReloadMiddleware",
        "django.middleware.security.SecurityMiddleware",
        "django.contrib.sessions.middleware.SessionMiddleware",
        "django.middleware.csrf.CsrfViewMiddleware",
        "django.contrib.auth.middleware.AuthenticationMiddleware",
        "django.contrib.messages.middleware.MessageMiddleware",
        "django.middleware.locale.LocaleMiddleware",
        "django.middleware.common.CommonMiddleware",
        "django.middleware.clickjacking.XFrameOptionsMiddleware",
        "dockerflow.django.middleware.DockerflowMiddleware",
        "cms.middleware.user.CurrentUserMiddleware",
        "cms.middleware.page.CurrentPageMiddleware",
        "cms.middleware.toolbar.ToolbarMiddleware",
        "cms.middleware.language.LanguageCookieMiddleware",
        "dj_pagination.middleware.PaginationMiddleware",
        "richie.apps.social.middleware.SocialAuthExceptionMiddleware",
    )

    # Django applications from the highest priority to the lowest
    INSTALLED_APPS = (
        # Richie stuff
        "richie.apps.demo",
        "richie.apps.search",
        "richie.apps.courses",
        "richie.apps.core",
        "richie.apps.social",
        "richie.plugins.glimpse",
        "richie.plugins.html_sitemap",
        "richie.plugins.large_banner",
        "richie.plugins.nesteditem",
        "richie.plugins.plain_text",
        "richie.plugins.section",
        "richie.plugins.simple_picture",
        "richie.plugins.simple_text_ckeditor",
        "richie.plugins.lti_consumer",
        "richie",
        # Third party apps
        "dj_pagination",
        "dockerflow.django",
        "parler",
        "rest_framework",
        "social_django",
        # Django-cms
        "djangocms_admin_style",
        "djangocms_googlemap",
        "djangocms_link",
        "djangocms_picture",
        "djangocms_text_ckeditor",
        "djangocms_video",
        "cms",
        "menus",
        "sekizai",
        "treebeard",
        "filer",
        "easy_thumbnails",
        # django-autocomplete-light
        "dal",
        "dal_select2",
        # Django
        "django.contrib.auth",
        "django.contrib.contenttypes",
        "django.contrib.sessions",
        "django.contrib.admin",
        "django.contrib.sites",
        "django.contrib.sitemaps",
        "django.contrib.staticfiles",
        "django.contrib.messages",
        "django.contrib.humanize",
    )

    # Languages
    # - Django
    LANGUAGE_CODE = "en"

    # Careful! Languages should be ordered by priority, as this tuple is used to get
    # fallback/default languages throughout the app.
    # Use "en" as default as it is the language that is most likely to be spoken by any visitor
    # when their preferred language, whatever it is, is unavailable
    LANGUAGES = (("en", _("English")), ("fr", _("French")))

    # - Django CMS
    CMS_LANGUAGES = {
        "default": {
            "public": True,
            "hide_untranslated": False,
            "redirect_on_fallback": False,
            "fallbacks": ["en", "fr"],
        },
        1: [
            {
                "public": True,
                "code": "en",
                "hide_untranslated": False,
                "name": _("English"),
                "fallbacks": ["fr"],
                "redirect_on_fallback": False,
            },
            {
                "public": True,
                "code": "fr",
                "hide_untranslated": False,
                "name": _("French"),
                "fallbacks": ["en"],
                "redirect_on_fallback": False,
            },
        ],
    }

    # - Django Parler
    PARLER_LANGUAGES = CMS_LANGUAGES

    # Permisions
    # - Django CMS
    CMS_PERMISSION = True

    # - Django Filer
    FILER_ENABLE_PERMISSIONS = True
    FILER_IS_PUBLIC_DEFAULT = True

    # - Django Pagination
    PAGINATION_INVALID_PAGE_RAISES_404 = True
    PAGINATION_DEFAULT_WINDOW = 2
    PAGINATION_DEFAULT_MARGIN = 1

    # Logging
    LOGGING = {
        "version": 1,
        "disable_existing_loggers": True,
        "formatters": {
            "verbose": {
                "format": "%(levelname)s %(asctime)s %(module)s "
                "%(process)d %(thread)d %(message)s"
            }
        },
        "handlers": {
            "console": {
                "level": "DEBUG",
                "class": "logging.StreamHandler",
                "formatter": "verbose",
            }
        },
        "loggers": {
            "django.db.backends": {
                "level": "ERROR",
                "handlers": ["console"],
                "propagate": False,
            }
        },
    }

    # Cache
    CACHES = {
        "default": {
            "BACKEND": values.Value(
                "django.core.cache.backends.locmem.LocMemCache",
                environ_name="CACHE_DEFAULT_BACKEND",
                environ_prefix=None,
            ),
            "LOCATION": values.Value(
                "", environ_name="CACHE_DEFAULT_LOCATION", environ_prefix=None
            ),
            "OPTIONS": values.DictValue(
                {}, environ_name="CACHE_DEFAULT_OPTIONS", environ_prefix=None
            ),
        },
        "search": {
            "BACKEND": values.Value(
                "django.core.cache.backends.locmem.LocMemCache",
                environ_name="SEARCH_CACHE_BACKEND",
                environ_prefix=None,
            ),
            "LOCATION": values.Value(
                "search_cache",
                environ_name="SEARCH_CACHE_NAME",
                environ_prefix=None,
            ),
            "TIMEOUT": 60,
        },
    }

    # For more details about CMS_CACHE_DURATION, see :
    # http://docs.django-cms.org/en/latest/reference/configuration.html#cms-cache-durations
    CMS_CACHE_DURATIONS = values.DictValue(
        {"menus": 3600, "content": 60, "permissions": 3600}
    )

    # Sessions
    SESSION_ENGINE = values.Value("django.contrib.sessions.backends.db")

    # Sentry
    SENTRY_DSN = values.Value(None, environ_name="SENTRY_DSN")

    # Web Analytics configuration
    WEB_ANALYTICS_ID = values.Value(
        None, environ_name="WEB_ANALYTICS_ID", environ_prefix=None
    )
    WEB_ANALYTICS_LOCATION = values.Value(
        "head", environ_name="WEB_ANALYTICS_LOCATION", environ_prefix=None
    )
    WEB_ANALYTICS_PROVIDER = values.Value(
        "google_analytics", environ_name="WEB_ANALYTICS_PROVIDER", environ_prefix=None
    )

    # Minimum enrollment count value that would be shown on course detail page
    RICHIE_MINIMUM_COURSE_RUNS_ENROLLMENT_COUNT = values.Value(
        5000,
        environ_name="RICHIE_MINIMUM_COURSE_RUNS_ENROLLMENT_COUNT",
        environ_prefix=None,
    )

    @classmethod
    def _get_environment(cls):
        """Environment in which the application is launched."""
        return cls.__name__.lower()

    # pylint: disable=invalid-name
    @property
    def ENVIRONMENT(self):
        """Environment in which the application is launched."""
        return self._get_environment()

    # pylint: disable=invalid-name
    @property
    def RELEASE(self):
        """
        Return the release information.

        Delegate to the module function to enable easier testing.
        """
        return get_release()

    @classmethod
    def post_setup(cls):
        """Post setup configuration.
        This is the place where you can configure settings that require other
        settings to be loaded.
        """
        super().post_setup()

        # The SENTRY_DSN setting should be available to activate sentry for an environment
        if cls.SENTRY_DSN is not None:
            sentry_sdk.init(  # pylint: disable=abstract-class-instantiated
                dsn=cls.SENTRY_DSN,
                environment=cls._get_environment(),
                release=get_release(),
                integrations=[DjangoIntegration()],
            )
            with sentry_sdk.configure_scope() as scope:
                scope.set_extra("application", "backend")


class Development(Base):
    """
    Development environment settings

    We set DEBUG to True and configure the server to respond from all hosts.
    """

    DEBUG = True
    ALLOWED_HOSTS = ["*"]
    # Needed by LTI Consumer plugin
    # When we use a LTI provider on localhost domain, browser security needs to be lowered,
    # as crossdomain iframe posting is dangerous.
    SECURE_REFERRER_POLICY = "unsafe-url"


class Test(Base):
    """Test environment settings"""

    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": "mymaster/redis-sentinel:26379,redis-sentinel:26379/0",
            "OPTIONS": {"CLIENT_CLASS": "richie.apps.core.cache.SentinelClient"},
        },
        "search": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "search_cache",
            "TIMEOUT": 60,
        },
    }

    RICHIE_LMS_BACKENDS = [
        {
            "BASE_URL": "http://localhost:8073",
            "BACKEND": "richie.apps.courses.lms.edx.EdXLMSBackend",
            "COURSE_REGEX": r"^.*/courses/(?P<course_id>.*)/course/?$",
            "JS_BACKEND": "base",
            "JS_COURSE_REGEX": r"^.*/courses/(.*)/course/?$",
        }
    ]


class ContinuousIntegration(Test):
    """
    Continous Integration environment settings

    nota bene: it should inherit from the Test environment.
    """


class Production(Base):
    """Production environment settings

    You must define the DJANGO_ALLOWED_HOSTS and DJANGO_SECRET_KEY environment
    variables in Production configuration (and derived configurations):

    DJANGO_ALLOWED_HOSTS="foo.com,foo.fr"
    DJANGO_SECRET_KEY="your-secret-key"
    """

    # Security
    SECRET_KEY = values.SecretValue()
    ALLOWED_HOSTS = values.ListValue(None)
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SESSION_COOKIE_SECURE = True

    # For static files in production, we want to use a backend that includes a hash in
    # the filename, that is calculated from the file content, so that browsers always
    # get the updated version of each file.
    STATICFILES_STORAGE = (
        "django.contrib.staticfiles.storage.ManifestStaticFilesStorage"
    )

    # For more details about CMS_CACHE_DURATION, see :
    # http://docs.django-cms.org/en/latest/reference/configuration.html#cms-cache-durations
    CMS_CACHE_DURATIONS = values.DictValue(
        {"menus": 3600, "content": 86400, "permissions": 86400}
    )

    # By default, Django CMS sends cached responses with a
    # Cache-control: max-age value that reflects the server cache TTL
    # (CMS_CACHE_DURATIONS["content"])
    #
    # The thing is : we can invalidate a server side cache entry, but we cannot
    # invalidate our client browser cache entries. That's why we want to set a
    # long TTL on the server side, but a much lower TTL on the browser cache.
    #
    # This setting allows to define a maximum value for the max-age header
    # returned by Django CMS views.
    MAX_BROWSER_CACHE_TTL = 600


class Feature(Production):
    """
    Feature environment settings

    nota bene: it should inherit from the Production environment.
    """


class Staging(Production):
    """
    Staging environment settings

    nota bene: it should inherit from the Production environment.
    """


class PreProduction(Production):
    """
    Pre-production environment settings

    nota bene: it should inherit from the Production environment.
    """
