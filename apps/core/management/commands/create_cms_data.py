"""
create_cms_data management command
"""
from cms import models as cms_models
from cms.api import add_plugin, create_page, create_title
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.contrib.sites.models import Site

from apps.organizations.models import OrganizationPage, get_organization_data


PAGES = {
    'news':
        {'fr': "Actualité", 'en': "News", 'slug_fr': 'news_fr', 'slug_en': 'news', 'cms': True,
         'kwargs': {'template': 'richie/fullwidth.html'}},
    'courses':
        {'fr': "Tous les cours", 'en': "All courses", 'slug_fr': 'courses_fr',
         'slug_en': 'courses', 'cms': True, 'kwargs': {'template': 'richie/fullwidth.html'}},
    'universities':
        {'fr': "Etablissements", 'en': "Universities", 'slug_fr': 'organizations_fr',
         'slug_en': 'organizations', 'cms': True,
         'kwargs': {'template': 'organizations/cms/organization_list.html', }},
    'dashboard':
        {'fr': "Mes courses", 'en': "Dashboard", 'slug_fr': 'dashboard', 'slug_en': 'dashboard',
         'cms': False, 'kwargs': {'template': 'richie/fullwidth.html'}},
    'about':
        {'fr': "A propos", 'en': "About", 'slug_fr': 'apropos', 'slug_en': 'about', 'cms': True,
         'kwargs': {'template': 'richie/fullwidth.html'}},
}

ORGANIZATIONS = ['1', '2', '3', '4', '5']  # ids of real organizations

FUN_ORGANIZATION_API = "https://www.fun-mooc.fr/fun/api/universities/"


def clear_cms_data():
    """Clear all CMS data (CMS models + organization page)"""

    cms_models.Page.objects.all().delete()
    cms_models.Title.objects.all().delete()
    cms_models.CMSPlugin.objects.all().delete()
    cms_models.Placeholder.objects.all().delete()
    OrganizationPage.objects.all().delete()


def create_cms_data():
    """Create base CMS data"""

    site = Site.objects.get(id=1)

    # root page
    root = create_page(
        title="Accueil",
        slug='/',
        template='richie/fullwidth.html',
        language='fr',
        in_navigation=True,
        reverse_id='index',
        soft_root=True,
        site=site,
        published=True,
    )

    create_title(
        language='en',
        title='Home',
        slug='/',
        page=root
    )

    for name, page in PAGES.items():

        page_fr = create_page(
            title=page['fr'],
            slug=page['slug_fr'],
            language='fr',
            menu_title=page['fr'],
            parent=root,
            reverse_id=page['slug_fr'],
            in_navigation=True,
            published=True,
            site=site,
            **page['kwargs']
        )

        create_title(
            language='en',
            title=page['en'],
            slug=page['slug_en'],
            page=page_fr
        )
        PAGES[name]['instance_fr'] = page_fr

    # Page object is unique among languages, i18n is handled by titles (which also handle slug)
    # and content plugins.
    # We create a single page, with french as language, wich will create its Title object
    # for french, then we create a Title object for english
    # Finnaly we add to the main content placeholder a text plugin for each language
    for organization_key in ORGANIZATIONS:
        datas = get_organization_data(organization_key)
        organizations_page = PAGES['universities']['instance_fr']
        page = create_page(
            title=datas['name'],
            slug=datas['code'],
            language='fr',
            parent=organizations_page,
            template='organizations/cms/organization.html',
            reverse_id=datas['code'],
            in_navigation=True,
            published=True,
            site=site,
        )

        create_title(
            language='en',
            title=datas['name']+"_en",
            slug=datas['code']+"_en",
            page=page,
        )
        OrganizationPage(organization_key=organization_key, extended_object=page).save()

        placeholder = page.placeholders.get(slot='maincontent')
        add_plugin(
            placeholder=placeholder,
            plugin_type='TextPlugin',
            language='fr',
            body='Le Lorem ipsum...',
        )
        add_plugin(
            placeholder=placeholder,
            plugin_type='TextPlugin',
            language='en',
            body='The Lorem ipsum...',
        )
        page.published = True
        page.save()


class Command(BaseCommand):
    """Create default pages for FUN frontend"""

    help = __doc__

    def add_arguments(self, parser):

        parser.add_argument(
            '-f',
            '--force',
            action='store_true',
            default=False,
            help="Force command execution despite DEBUG is set to False",
        )

    def handle(self, *args, **options):

        if not settings.DEBUG and not options['force']:
            raise CommandError((
                "This command is not meant to be used in production environment "
                "except you know what you are doing, if so use --force parameter"
            ))

        clear_cms_data()
        create_cms_data()

        self.stdout.write("done")
