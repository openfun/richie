"""
Django settings for richie project.
"""
import json
import os

from django.utils.translation import ugettext_lazy as _

# pylint: disable=ungrouped-imports
import sentry_sdk
from configurations import Configuration, values
from elasticsearch import Elasticsearch
from sentry_sdk.integrations.django import DjangoIntegration

from richie.apps.search.utils.indexers import IndicesList

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join("/", "data")


def get_release():
    """Get current release of the application

    By release, we mean the release from the version.json file à la Mozilla [1]
    (if any). If this file has not been found, it defaults to "NA".

    [1]
    https://github.com/mozilla-services/Dockerflow/blob/master/docs/version_object.md
    """

    # Try to get the current release from the version.json file generated by the
    # CI during the Docker image build
    try:
        with open(os.path.join(BASE_DIR, "version.json")) as version:
            return json.load(version)["version"]
    except FileNotFoundError:
        pass

    # Default: not available
    return "NA"


class ElasticSearchMixin:
    """
    Elastic Search configuration mixin

    You may want to override default configuration by setting the following environment
    variable:

    * ES_CLIENT
    """

    ES_CLIENT = Elasticsearch(
        [values.Value("localhost", environ_name="ES_CLIENT", environ_prefix=None)]
    )
    ES_CHUNK_SIZE = 500
    ES_INDICES = IndicesList(
        courses="richie.apps.search.indexers.courses.CoursesIndexer",
        organizations="richie.apps.search.indexers.organizations.OrganizationsIndexer",
        categories="richie.apps.search.indexers.categories.CategoriesIndexer",
    )

    ES_DEFAULT_PAGE_SIZE = 10


class DRFMixin:
    """
    Django Rest Framework configuration mixin.
    NB: DRF picks its settings from the REST_FRAMEWORK namespace on the settings, hence
    the nesting of all our values inside that prop
    """

    REST_FRAMEWORK = {
        "ALLOWED_VERSIONS": ("1.0",),
        "DEFAULT_VERSION": "1.0",
        "DEFAULT_VERSIONING_CLASS": "rest_framework.versioning.URLPathVersioning",
    }


class Base(DRFMixin, ElasticSearchMixin, Configuration):
    """
    This is the base configuration every configuration (aka environnement) should inherit from. It
    is recommended to configure third-party applications by creating a configuration mixins in
    ./configurations and compose the Base configuration with those mixins.

    It depends on an environment variable that SHOULD be defined:

    * DJANGO_SECRET_KEY

    You may also want to override default configuration by setting the following environment
    variables:

    * DJANGO_SENTRY_DSN
    * ES_CLIENT
    * POSTGRES_DB
    * POSTGRES_HOST
    * POSTGRES_PASSWORD
    * POSTGRES_USER
    """

    SECRET_KEY = values.Value(None)
    DEBUG = False
    ALLOWED_HOSTS = []
    SITE_ID = 1

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
    STATICFILES_DIRS = (os.path.join(BASE_DIR, "static"),)

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
                ],
                "loaders": [
                    "django.template.loaders.filesystem.Loader",
                    "django.template.loaders.app_directories.Loader",
                ],
            },
        }
    ]

    MIDDLEWARE = (
        "cms.middleware.utils.ApphookReloadMiddleware",
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
    )

    INSTALLED_APPS = (
        # Django
        "djangocms_admin_style",
        "django.contrib.auth",
        "django.contrib.contenttypes",
        "django.contrib.sessions",
        "django.contrib.admin",
        "django.contrib.sites",
        "django.contrib.sitemaps",
        "django.contrib.staticfiles",
        "django.contrib.messages",
        # Django-cms
        "cms",
        "menus",
        "sekizai",
        "treebeard",
        "djangocms_text_ckeditor",
        "filer",
        "easy_thumbnails",
        "djangocms_link",
        "djangocms_googlemap",
        "djangocms_video",
        "djangocms_picture",
        # Richie stuff
        "richie",
        "richie.apps.core",
        "richie.apps.courses",
        "richie.apps.persons",
        "richie.apps.search",
        "richie.plugins.large_banner",
        "richie.plugins.plain_text",
        "richie.plugins.section",
        "richie.plugins.simple_text_ckeditor",
        # Third party apps
        "dockerflow.django",
        "parler",
        "rest_framework",
    )

    # Group to add plugin to placeholder "Content"
    FUN_PLUGINS_GROUP = "Fun Plugins"

    LANGUAGE_CODE = "en"

    # Django sets `LANGUAGES` by default with all supported languages. Let's save it to a
    # different setting before overriding it with the languages active in the CMS. We can use it
    # for example for the choice of languages on the course run which should not be limited to
    # the few languages active in the CMS.
    # pylint: disable=no-member
    ALL_LANGUAGES = Configuration.LANGUAGES
    ALL_LANGUAGES_DICT = dict(ALL_LANGUAGES)

    # Careful! Languages should be ordered by priority, as this tuple is used to get
    # fallback/default languages throughout the app.
    # Use "en" as default as it is the language that is most likely to be spoken by any visitor
    # when their preferred language, whatever it is, is unavailable
    LANGUAGES = (("en", _("English")), ("fr", _("French")))
    LANGUAGES_DICT = dict(LANGUAGES)
    LANGUAGE_NAME = LANGUAGES_DICT[LANGUAGE_CODE]

    # Django CMS settings
    CMS_LANGUAGES = {
        "default": {
            "public": True,
            "hide_untranslated": False,
            "redirect_on_fallback": True,
            "fallbacks": ["en", "fr"],
        },
        1: [
            {
                "public": True,
                "code": "en",
                "hide_untranslated": False,
                "name": _("English"),
                "fallbacks": ["fr"],
                "redirect_on_fallback": True,
            },
            {
                "public": True,
                "code": "fr",
                "hide_untranslated": False,
                "name": _("French"),
                "fallbacks": ["en"],
                "redirect_on_fallback": True,
            },
        ],
    }

    PARLER_LANGUAGES = CMS_LANGUAGES

    CMS_TEMPLATES = (
        ("courses/cms/course_detail.html", _("Course page")),
        ("courses/cms/course_run_detail.html", _("Course run page")),
        ("courses/cms/organization_list.html", _("Organization list")),
        ("courses/cms/organization_detail.html", _("Organization page")),
        ("courses/cms/category_detail.html", _("Category page")),
        ("persons/cms/person_detail.html", _("Person page")),
        ("search/search.html", _("Search")),
        ("richie/fullwidth.html", "Fullwidth"),
        ("richie/child_pages_list.html", _("List of child pages")),
        ("richie/homepage.html", _("Homepage")),
        ("richie/single-column.html", _("Single column")),
    )
    CMS_PERMISSION = True

    CMS_PLACEHOLDER_CONF = {
        # Homepage
        "richie/homepage.html maincontent": {
            "name": _("Main content"),
            "plugins": ["LargeBannerPlugin", "SectionPlugin"],
            "child_classes": {
                "SectionPlugin": [
                    "CoursePlugin",
                    "OrganizationPlugin",
                    "CategoryPlugin",
                    "PersonPlugin",
                    "LinkPlugin",
                ]
            },
        },
        # Single column page
        "richie/single-column.html maincontent": {
            "name": _("Main content"),
            "excluded_plugins": ["CKEditorPlugin", "GoogleMapPlugin"],
            "parent_classes": {
                "CoursePlugin": ["SectionPlugin"],
                "OrganizationPlugin": ["SectionPlugin"],
                "CategoryPlugin": ["SectionPlugin"],
                "PersonPlugin": ["SectionPlugin"],
            },
            "child_classes": {
                "SectionPlugin": [
                    "CoursePlugin",
                    "OrganizationPlugin",
                    "CategoryPlugin",
                    "PersonPlugin",
                    "LinkPlugin",
                ]
            },
        },
        # Course detail
        "courses/cms/course_detail.html course_cover": {
            "name": _("Cover"),
            "plugins": ["PicturePlugin"],
            "limits": {"PicturePlugin": 1},
        },
        "courses/cms/course_detail.html course_teaser": {
            "name": _("Teaser"),
            "plugins": ["VideoPlayerPlugin", "PicturePlugin"],
            "limits": {"VideoPlayerPlugin": 1, "PicturePlugin": 1},
        },
        "courses/cms/course_detail.html course_syllabus": {
            "name": _("About the course"),
            "plugins": ["CKEditorPlugin"],
        },
        "courses/cms/course_detail.html course_format": {
            "name": _("Format"),
            "plugins": ["CKEditorPlugin"],
        },
        "courses/cms/course_detail.html course_prerequisites": {
            "name": _("Prerequisites"),
            "plugins": ["CKEditorPlugin"],
        },
        "courses/cms/course_detail.html course_team": {
            "name": _("Team"),
            "plugins": ["PersonPlugin"],
        },
        "courses/cms/course_detail.html course_plan": {
            "name": _("Plan"),
            "plugins": ["CKEditorPlugin"],
        },
        "courses/cms/course_detail.html course_information": {
            "name": _("Complementary information"),
            "plugins": ["SectionPlugin"],
        },
        "courses/cms/course_detail.html course_license_content": {
            "name": _("License for the course content"),
            "plugins": ["LicencePlugin"],
            "limits": {"LicencePlugin": 1},
        },
        "courses/cms/course_detail.html course_license_participation": {
            "name": _("License for the content created by course participants"),
            "plugins": ["LicencePlugin"],
            "limits": {"LicencePlugin": 1},
        },
        "courses/cms/course_detail.html course_categories": {
            "name": _("Categories"),
            "plugins": ["CategoryPlugin"],
        },
        "courses/cms/course_detail.html course_organizations": {
            "name": _("Organizations"),
            "plugins": ["OrganizationPlugin"],
        },
        # Organization detail
        "courses/cms/organization_detail.html banner": {
            "name": _("Banner"),
            "plugins": ["PicturePlugin"],
            "limits": {"PicturePlugin": 1},
        },
        "courses/cms/organization_detail.html logo": {
            "name": _("Logo"),
            "plugins": ["PicturePlugin"],
            "limits": {"PicturePlugin": 1},
        },
        "courses/cms/organization_detail.html description": {
            "name": _("Description"),
            "plugins": ["CKEditorPlugin"],
            "limits": {"CKEditorPlugin": 1},
        },
        # Category detail
        "courses/cms/category_detail.html banner": {
            "name": _("Banner"),
            "plugins": ["PicturePlugin"],
            "limits": {"PicturePlugin": 1},
        },
        "courses/cms/category_detail.html logo": {
            "name": _("Logo"),
            "plugins": ["PicturePlugin"],
            "limits": {"PicturePlugin": 1},
        },
        "courses/cms/category_detail.html description": {
            "name": _("Description"),
            "plugins": ["CKEditorPlugin"],
            "limits": {"CKEditorPlugin": 1},
        },
        # Person detail
        "persons/cms/person_detail.html portrait": {
            "name": _("Portrait"),
            "plugins": ["PicturePlugin"],
            "limits": {"PicturePlugin": 1},
        },
        "persons/cms/person_detail.html resume": {
            "name": _("Resume"),
            "plugins": ["CKEditorPlugin"],
            "limits": {"CKEditorPlugin": 1},
        },
    }

    # Main CKEditor configuration
    CKEDITOR_SETTINGS = {
        "language": "{{ language }}",
        "skin": "moono-lisa",
        "toolbarCanCollapse": False,
        "contentsCss": "/static/css/ckeditor.css",
        # Enabled showblocks as default behavior
        "startupOutlineBlocks": True,
        # Enable some plugins
        # 'extraPlugins': 'codemirror',
        # Disable element filter to enable full HTML5, also this will let
        # append any code, even bad syntax and malicious code, so be careful
        "removePlugins": "stylesheetparser",
        "allowedContent": True,
        # Image plugin options
        "image_prefillDimensions": False,
        # Justify text using shortand class names
        "justifyClasses": ["text-left", "text-center", "text-right"],
        # Default toolbar configurations for djangocms_text_ckeditor
        "toolbar": "CMS",
        "toolbar_CMS": [
            ["Undo", "Redo"],
            ["cmsplugins", "-", "ShowBlocks"],
            ["Format", "Styles"],
            ["RemoveFormat"],
            ["Maximize"],
            "/",
            ["Bold", "Italic", "Underline", "-", "Subscript", "Superscript"],
            ["JustifyLeft", "JustifyCenter", "JustifyRight"],
            ["Link", "Unlink"],
            [
                "Image",
                "-",
                "NumberedList",
                "BulletedList",
                "-",
                "Table",
                "-",
                "CreateDiv",
                "HorizontalRule",
            ],
            ["Source"],
        ],
    }
    # Share the same configuration for djangocms_text_ckeditor field and derived
    # CKEditor widgets/fields
    CKEDITOR_SETTINGS["toolbar_HTMLField"] = CKEDITOR_SETTINGS["toolbar_CMS"]

    # Basic CKEditor configuration for restricted inline markup only
    CKEDITOR_BASIC_SETTINGS = {
        "language": "{{ language }}",
        "skin": "moono-lisa",
        "toolbarCanCollapse": False,
        "contentsCss": "/static/css/ckeditor.css",
        # Only enable following tag definitions
        "allowedContent": ["p", "b", "i", "a[href]"],
        # Enabled showblocks as default behavior
        "startupOutlineBlocks": True,
        # Default toolbar configurations for djangocms_text_ckeditor
        "toolbar": "HTMLField",
        "toolbar_HTMLField": [["Undo", "Redo"], ["Bold", "Italic"], ["Link", "Unlink"]],
    }

    # Additional LinkPlugin templates. Note how choice value is just a keyword
    # instead of full template path. Value is used inside a path formatting
    # such as "templates/djangocms_link/VALUE/link.html"
    DJANGOCMS_LINK_TEMPLATES = [("button-caesura", _("Button caesura"))]

    # Thumbnails settings
    THUMBNAIL_PROCESSORS = (
        "easy_thumbnails.processors.colorspace",
        "easy_thumbnails.processors.autocrop",
        "filer.thumbnail_processors.scale_and_crop_with_subject_location",
        "easy_thumbnails.processors.filters",
        "easy_thumbnails.processors.background",
    )

    RICHIE_SECTION_TEMPLATES = [
        ("richie/section/section.html", _("Default")),
        ("richie/section/highlighted_items.html", _("Highlighted items")),
    ]

    RICHIE_LARGEBANNER_TEMPLATES = [
        ("richie/large_banner/large_banner.html", _("Default")),
        ("richie/large_banner/hero-intro.html", _("Hero introduction")),
    ]

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

    @classmethod
    def post_setup(cls):
        """Post setup configuration.
        This is the place where you can configure settings that require other
        settings to be loaded.
        """
        super().post_setup()

        # The DJANGO_SENTRY_DSN environment variable should be set to activate
        # sentry for an environment
        sentry_dsn = values.Value(None, environ_name="SENTRY_DSN")
        if sentry_dsn is not None:
            sentry_sdk.init(
                dsn=sentry_dsn,
                environment=cls.__name__.lower(),
                release=get_release(),
                integrations=[DjangoIntegration()],
            )


class Development(Base):
    """
    Development environment settings

    We set DEBUG to True and configure the server to respond from all hosts.
    """

    DEBUG = True
    ALLOWED_HOSTS = ["*"]


class Test(Base):
    """Test environment settings"""


class ContinuousIntegration(Test):
    """
    Continous Integration environment settings

    nota bene: it should inherit from the Test environment.
    """


class Production(Base):
    """Production environment settings

    You must define the DJANGO_ALLOWED_HOSTS environment variable in Production
    configuration (and derived configurations):

    DJANGO_ALLOWED_HOSTS="foo.com,foo.fr"
    """

    ALLOWED_HOSTS = values.ListValue(None)

    # For static files in production, we want to use a backend that includes a hash in
    # the filename, that is calculated from the file content, so that browsers always
    # get the updated version of each file.
    STATICFILES_STORAGE = (
        "django.contrib.staticfiles.storage.ManifestStaticFilesStorage"
    )


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
