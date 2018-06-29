"""
create_demo_site management command
"""
import logging

from django.conf import settings
from django.contrib.sites.models import Site
from django.core.management.base import BaseCommand, CommandError
from django.utils import translation

from cms import models as cms_models

from richie.apps.courses.factories import OrganizationFactory, SubjectFactory
from richie.apps.courses.models import Course, Organization, Subject
from richie.apps.persons.factories import PersonFactory
from richie.apps.persons.models import Person

from ...helpers import create_i18n_page

logger = logging.getLogger("richie.commands.core.create_demo_site")

NB_ORGANIZATIONS = 8
NB_SUBJECTS = 8
NB_PERSONS = 10
PAGE_INFOS = {
    "home": {
        "content": {"en": "Home", "fr": "Accueil"},
        "kwargs": {"template": "richie/fullwidth.html"},
    },
    "news": {
        "content": {"en": "News", "fr": "Actualités"},
        "kwargs": {"template": "richie/fullwidth.html"},
    },
    "courses": {
        "content": {"en": "Courses", "fr": "Cours"},
        "kwargs": {
            "reverse_id": Course.ROOT_REVERSE_ID,
            "template": "search/search.html",
        },
    },
    "subjects": {
        "content": {"en": "Subjects", "fr": "Sujets"},
        "kwargs": {
            "reverse_id": Subject.ROOT_REVERSE_ID,
            "template": "richie/fullwidth.html",
        },
    },
    "organizations": {
        "content": {"en": "Organizations", "fr": "Etablissements"},
        "kwargs": {
            "reverse_id": Organization.ROOT_REVERSE_ID,
            "template": "richie/fullwidth.html",
        },
    },
    "persons": {
        "content": {"en": "Persons", "fr": "Personnes"},
        "kwargs": {
            "reverse_id": Person.ROOT_REVERSE_ID,
            "template": "richie/fullwidth.html",
        },
    },
    "dashboard": {
        "content": {"en": "Dashboard", "fr": "Tableau de bord"},
        "cms": False,
        "kwargs": {"template": "richie/fullwidth.html"},
    },
    "about": {
        "content": {"en": "About", "fr": "A propos"},
        "kwargs": {"template": "richie/fullwidth.html"},
    },
}


# pylint: disable=no-member
#
# Looks like pylint is not relevant at guessing object types when cascading
# methods over querysets: Instance of 'list' has no 'delete' member (no-member).
# We choose to ignore this false positive warning.
def clear_cms_data():
    """Clear all CMS data (CMS models + apps models)"""

    cms_models.Page.objects.all().delete()
    cms_models.Title.objects.all().delete()
    cms_models.CMSPlugin.objects.all().delete()
    cms_models.Placeholder.objects.all().delete()
    Course.objects.all().delete()
    Organization.objects.all().delete()
    Subject.objects.all().delete()
    Person.objects.all().delete()


def create_demo_site():
    """
    Create a simple site tree structure for developpers to work in realistic environment.

    We create multilingual pages, add organizations under the related page and add
    plugins to each page.
    """
    site = Site.objects.get(id=1)

    # Create pages as described in PAGES_INFOS
    pages_created = {}
    for name, info in PAGE_INFOS.items():
        page = create_i18n_page(
            info["content"],
            is_homepage=(name == "home"),
            in_navigation=True,
            published=True,
            site=site,
            **info["kwargs"]
        )
        pages_created[name] = page

    # Create organizations under the `organizations` page
    OrganizationFactory.create_batch(
        NB_ORGANIZATIONS, parent=pages_created["organizations"], with_content=True
    )

    # Create subjects under the `subjects` page
    SubjectFactory.create_batch(
        NB_SUBJECTS,
        parent=pages_created["subjects"],
        fill_banner=True,
        fill_description=True,
        fill_logo=True,
    )

    # Django parler require a language to be manually set when working out of
    # request/response flow and PersonTitle use 'parler'
    translation.activate(settings.LANGUAGE_CODE)

    # Create persons under the `persons` page
    PersonFactory.create_batch(
        NB_PERSONS, parent=pages_created["persons"], with_content=True
    )


class Command(BaseCommand):
    """Create default pages for FUN frontend"""

    help = __doc__

    def add_arguments(self, parser):

        parser.add_argument(
            "-f",
            "--force",
            action="store_true",
            default=False,
            help="Force command execution despite DEBUG is set to False",
        )

    def handle(self, *args, **options):

        if not settings.DEBUG and not options["force"]:
            raise CommandError(
                (
                    "This command is not meant to be used in production environment "
                    "except you know what you are doing, if so use --force parameter"
                )
            )

        clear_cms_data()
        create_demo_site()

        logger.info("done")
