"""
create_cms_data management command
"""
from cms import models as cms_models
from cms.api import add_plugin, create_page, create_title
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.contrib.sites.models import Site

from apps.organizations.models import OrganizationPage, Organization

from apps.organizations.factories import OrganizationFactory

PAGES = {
    'home':
        {'fr': "Accueil", 'en': "Home", 'slug_fr': '/', 'slug_en': '/',
         'kwargs': {'template': 'richie/fullwidth.html'}},
    'news':
        {'fr': "Actualité", 'en': "News", 'slug_fr': 'news_fr', 'slug_en': 'news',
         'kwargs': {'template': 'richie/fullwidth.html'}},
    'courses':
        {'fr': "Tous les cours", 'en': "All courses", 'slug_fr': 'courses_fr',
         'slug_en': 'courses', 'kwargs': {'template': 'richie/fullwidth.html'}},
    'universities':
        {'fr': "Etablissements", 'en': "Universities", 'slug_fr': 'organizations_fr',
         'slug_en': 'organizations',
         'kwargs': {'template': 'organizations/cms/organization_list.html', }},
    'dashboard':
        {'fr': "Mes cours", 'en': "Dashboard", 'slug_fr': 'dashboard', 'slug_en': 'dashboard',
         'cms': False, 'kwargs': {'template': 'richie/fullwidth.html'}},
    'about':
        {'fr': "A propos", 'en': "About", 'slug_fr': 'apropos', 'slug_en': 'about',
         'kwargs': {'template': 'richie/fullwidth.html'}},
}

NB_ORGANIZATIONS = 8


def clear_cms_data():
    """Clear all CMS data (CMS models + organization page)"""

    cms_models.Page.objects.all().delete()
    cms_models.Title.objects.all().delete()
    cms_models.CMSPlugin.objects.all().delete()
    cms_models.Placeholder.objects.all().delete()
    OrganizationPage.objects.all().delete()
    Organization.objects.all().delete()


def create_cms_data():
    """Create base CMS data"""

    site = Site.objects.get(id=1)

    for name, page in PAGES.items():

        base_page = create_page(
            title=page['fr'],
            slug=page['slug_fr'],
            language='fr',
            menu_title=page['fr'],
            reverse_id=page['slug_en'],
            in_navigation=True,
            published=True,
            site=site,
            **page['kwargs']
        )

        create_title(
            language='en',
            title=page['en'],
            slug=page['slug_en'],
            page=base_page
        )
        base_page.publish('en')

        if name == 'home':
            base_page.set_as_homepage()  # landing page

        PAGES[name]['instance_fr'] = base_page

    # Page object is unique among languages, i18n is handled by titles (which also handle slug)
    # and content plugins.
    # We create a single page, with french as language, wich will create its Title object
    # for french, then we create a Title object for english
    # Finnaly we add to the main content placeholder a text plugin for each language
    organizations_page = PAGES['universities']['instance_fr']

    for _ in range(NB_ORGANIZATIONS):
        organization = OrganizationFactory()

        page = create_page(
            title=organization.name,
            slug=organization.code,
            language='fr',
            parent=organizations_page,
            template='organizations/cms/organization.html',
            reverse_id=organization.code,
            published=True,
            site=site,
        )

        create_title(
            language='en',
            title=organization.name + "EN",
            slug=organization.code+"_en",
            page=page)
        organization_page = OrganizationPage(
            organization=organization,
            extended_object=page)

        organization_page.save()

        placeholder = page.placeholders.get(slot='maincontent')
        add_plugin(
            placeholder=placeholder,
            plugin_type='TextPlugin', language='fr',
            body='Le Lorem ipsum...')
        add_plugin(
            placeholder=placeholder,
            plugin_type='TextPlugin',
            language='en',
            body='The Lorem ipsum...')
        page.save()
        page.publish('fr')
        page.publish('en')


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
