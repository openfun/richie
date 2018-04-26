"""
Django settings for richie project.
"""
import os

from configurations import Configuration, values
from django.utils.translation import ugettext_lazy as _

from .configurations.elasticsearch import ElasticSearchMixin
from .configurations.rest_framework import DRFMixin

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join('/', 'data')


class Base(DRFMixin, ElasticSearchMixin, Configuration):
    """
    This is the base configuration every configuration (aka environnement) should inherit from. It
    is recommended to configure third-party applications by creating a configuration mixins in
    ./configurations and compose the Base configuration with those mixins.

    It depends on an environment variable that SHOULD be defined:

    * DJANGO_SECRET_KEY

    You may also want to override default configuration by setting the following environment
    variables:

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
    ROOT_URLCONF = 'richie.urls'
    WSGI_APPLICATION = 'richie.wsgi.application'

    # Database
    DATABASES = {
        'default': {
            'ENGINE': values.Value(
                'django.db.backends.postgresql_psycopg2',
                environ_name='DATABASE_ENGINE',
                environ_prefix=None
            ),
            'NAME': values.Value('richie', environ_name='POSTGRES_DB', environ_prefix=None),
            'USER': values.Value('fun', environ_name='POSTGRES_USER', environ_prefix=None),
            'PASSWORD': values.Value(
                'pass',
                environ_name='POSTGRES_PASSWORD',
                environ_prefix=None
            ),
            'HOST': values.Value('localhost', environ_name='POSTGRES_HOST', environ_prefix=None),
            'PORT': values.Value(5432, environ_name='POSTGRES_PORT', environ_prefix=None),
        }
    }
    MIGRATION_MODULES = {}

    # Static files (CSS, JavaScript, Images)
    STATIC_URL = '/static/'
    MEDIA_URL = '/media/'
    MEDIA_ROOT = os.path.join(DATA_DIR, 'media')
    STATIC_ROOT = os.path.join(DATA_DIR, 'static')
    STATICFILES_DIRS = (
        os.path.join(BASE_DIR, 'static'),
        os.path.join(BASE_DIR, 'build'),
    )

    # Internationalization
    TIME_ZONE = 'Europe/Paris'
    USE_I18N = True
    USE_L10N = True
    USE_TZ = True

    # Templates
    TEMPLATES = [
        {
            'BACKEND': 'django.template.backends.django.DjangoTemplates',
            'DIRS': [os.path.join(BASE_DIR, 'templates')],
            'OPTIONS': {
                'context_processors': [
                    'django.contrib.auth.context_processors.auth',
                    'django.contrib.messages.context_processors.messages',
                    'django.template.context_processors.i18n',
                    'django.template.context_processors.debug',
                    'django.template.context_processors.request',
                    'django.template.context_processors.media',
                    'django.template.context_processors.csrf',
                    'django.template.context_processors.tz',
                    'sekizai.context_processors.sekizai',
                    'django.template.context_processors.static',
                    'cms.context_processors.cms_settings'
                ],
                'loaders': [
                    'django.template.loaders.filesystem.Loader',
                    'django.template.loaders.app_directories.Loader',
                    'django.template.loaders.eggs.Loader'
                ],
            },
        },
    ]

    MIDDLEWARE_CLASSES = (
        'cms.middleware.utils.ApphookReloadMiddleware',
        'django.contrib.sessions.middleware.SessionMiddleware',
        'django.middleware.csrf.CsrfViewMiddleware',
        'django.contrib.auth.middleware.AuthenticationMiddleware',
        'django.contrib.messages.middleware.MessageMiddleware',
        'django.middleware.locale.LocaleMiddleware',
        'django.middleware.common.CommonMiddleware',
        'django.middleware.clickjacking.XFrameOptionsMiddleware',
        'cms.middleware.user.CurrentUserMiddleware',
        'cms.middleware.page.CurrentPageMiddleware',
        'cms.middleware.toolbar.ToolbarMiddleware',
        'cms.middleware.language.LanguageCookieMiddleware'
    )

    INSTALLED_APPS = (
        # Django
        'djangocms_admin_style',
        'django.contrib.auth',
        'django.contrib.contenttypes',
        'django.contrib.sessions',
        'django.contrib.admin',
        'django.contrib.sites',
        'django.contrib.sitemaps',
        'django.contrib.staticfiles',
        'django.contrib.messages',

        # Django-cms
        'cms',
        'menus',
        'sekizai',
        'treebeard',
        'djangocms_text_ckeditor',
        'filer',
        'easy_thumbnails',
        'djangocms_column',
        'djangocms_link',
        'cmsplugin_filer_file',
        'cmsplugin_filer_folder',
        'cmsplugin_filer_image',
        'cmsplugin_filer_utils',
        'djangocms_style',
        'djangocms_snippet',
        'djangocms_googlemap',
        'djangocms_video',

        # Aldryn news blog
        'aldryn_apphooks_config',
        'aldryn_categories',
        'aldryn_common',
        'aldryn_newsblog',
        'aldryn_people',
        'aldryn_reversion',
        'aldryn_translation_tools',
        'parler',
        'sortedm2m',
        'taggit',
        'reversion',

        # FUN stuff
        'apps.core',
        'apps.organizations',
        'apps.search',
        'plugins.large_banner',
    )

    # Group to add plugin to placeholder "Content"
    FUN_PLUGINS_GROUP = "Fun Plugins"

    LANGUAGE_CODE = 'fr'
    # Careful! Languages should be ordered by priority, as this tuple is used to get
    # fallback/default languages throughout the app.
    # Use "en" as default as it is the language that is most likely to be spoken by any visitor
    # when their preferred language, whatever it is, is unavailable
    LANGUAGES = (
        ('en', _('en')),
        ('fr', _('fr')),
    )

    # Django CMS settings
    CMS_LANGUAGES = {
        'default': {
            'public': True,
            'hide_untranslated': False,
            'redirect_on_fallback': True,
            'fallbacks': ['en', 'fr'],
        },
        1: [
            {
                'public': True,
                'code': 'en',
                'hide_untranslated': False,
                'name': _('en'),
                'fallbacks': ['fr'],
                'redirect_on_fallback': True,
            },
            {
                'public': True,
                'code': 'fr',
                'hide_untranslated': False,
                'name': _('fr'),
                'fallbacks': ['en'],
                'redirect_on_fallback': True,
            },
        ],
    }

    PARLER_LANGUAGES = CMS_LANGUAGES

    CMS_TEMPLATES = (
        ('organizations/cms/organization.html', _("Organization page")),
        ('organizations/cms/organization_list.html', _("Organizations list page")),
        ('search/search.html', _('Search')),
        ('richie/fullwidth.html', 'Fullwidth'),
    )
    CMS_PERMISSION = True
    CMS_PLACEHOLDER_CONF = {}

    # Thumbnails settings
    THUMBNAIL_PROCESSORS = (
        'easy_thumbnails.processors.colorspace',
        'easy_thumbnails.processors.autocrop',
        'filer.thumbnail_processors.scale_and_crop_with_subject_location',
        'easy_thumbnails.processors.filters',
        'easy_thumbnails.processors.background',
    )


class Development(Base):
    """
    Development environment settings

    We set DEBUG to True and configure the server to respond from all hosts.
    """

    DEBUG = True
    ALLOWED_HOSTS = ['*', ]


class Test(Base):
    """Test environment settings"""
    pass


class ContinuousIntegration(Test):
    """
    Continous Integration environment settings

    nota bene: it should inherit from the Test environment.
    """
    pass


class Production(Base):
    """Production environment settings

    You must define the DJANGO_ALLOWED_HOSTS environment variable in Production
    configuration (and derived configurations):

    DJANGO_ALLOWED_HOSTS="foo.com,foo.fr"
    """

    ALLOWED_HOSTS = values.ListValue(None)


class Staging(Production):
    """
    Staging environment settings

    nota bene: it should inherit from the Production environment.
    """
    pass


class PreProduction(Production):
    """
    Pre-production environment settings

    nota bene: it should inherit from the Production environment.
    """
    pass
