# -*- coding: utf-8 -*-

from optparse import make_option

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.contrib.sites import models as sites_models
#from django.contrib.webdesign import lorem_ipsum

from cms import models as cms_models
from cms.api import create_page, create_title, add_plugin

PAGES = [
    {'fr': "Actualité", 'en': "News", 'slug_fr': 'actualite', 'slug_en': 'news', 'cms': True, 'template': 'fullwidth.html'},
    {'fr': "Tous les cours", 'en': "All courses", 'slug_fr': 'cours', 'slug_en': 'courses', 'cms': True, 'template': 'fullwidth.html'},
    {'fr': "Etablissements", 'en': "Universities", 'slug_fr': 'etablissements', 'slug_en': 'universities', 'cms': True, 'template': 'fullwidth.html'},
    {'fr': "Mes courses", 'en': "Dashboard", 'slug_fr': 'dashboard', 'slug_en': 'dashboard', 'cms': False, 'template': 'fullwidth.html'},
    {'fr': "A propos", 'en': "About", 'slug_fr': 'apropos', 'slug_en': 'about', 'cms': True, 'template': 'fullwidth.html'},
]



def create_child_page(parent_page_id):
    """Create child cms page and return it
    """
    args = {'site': sites_models.Site.objects.get(id=1)}
    args['in_navigation'] = True
    args['published'] = True
    args['parent'] = cms_models.Page.objects.get(id=parent_page_id)
    page = create_page("", 'fullwidth.html', 'fr', **kw(args))

    return page


def clear_cms_data():
    cms_models.Page.objects.all().delete()
    cms_models.CMSPlugin.objects.all().delete()
    cms_models.Placeholder.objects.all().delete()


def create_cms_data():

    site = sites_models.Site.objects.get(id=1)

    # root page
    root = create_page(
        title="Accueil", 
        slug='/',
        template='fullwidth.html', 
        language='fr', 
        in_navigation=True,
        reverse_id='index',
        soft_root=True,
        site=site,
        published=True,
        )


    for page in PAGES:

        fr = create_page(
            title=page['fr'], 
            slug=page['slug_fr'],
            template=page['template'], 
            language='fr', 
            menu_title=page['fr'],
            parent=root,
            reverse_id=page['slug_en'],
            in_navigation=True,
            published=True,
            site=site,
            )
        en = create_title(
            language='en', 
            title=page['en'], 
            slug=page['slug_en'],
            page=fr)


class Command(BaseCommand):
    help = 'Create default pages for FUN frontend'
    option_list = BaseCommand.option_list + (
        make_option('-f', '--force',
                    action='store_true',
                    default=False,
                    help="Force command execution despite DEBUG is set to False"
                    ),
    )

    def handle(self, *args, **options):
        if not settings.DEBUG and not options['force']:
            raise CommandError("This command is not meant to be used in production environment except you know what you are doing, if so use - -force parameter")
        clear_cms_data()
        create_cms_data()

        self.stdout.write("done")
