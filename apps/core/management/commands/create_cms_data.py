"""
create_cms_data management command
"""
import logging

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.contrib.sites.models import Site

from cms import models as cms_models

from apps.organizations.factories import OrganizationFactory
from apps.courses.models import COURSES_PAGE_REVERSE_ID, COURSE_SUBJECTS_PAGE_REVERSE_ID
from apps.organizations.models import (
    Organization,
    OrganizationPage,
    ORGANIZATIONS_PAGE_REVERSE_ID,
)
from ...helpers import create_i18n_page

logger = logging.getLogger("richie.commands.core.create_cms_data")

NB_ORGANIZATIONS = 8
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
        "content": {"en": "All courses", "fr": "Tous les cours"},
        "kwargs": {
            "reverse_id": COURSES_PAGE_REVERSE_ID, "template": "richie/fullwidth.html"
        },
    },
    "subjects": {
        "content": {"en": "All course subjects", "fr": "Tous les sujets de cours"},
        "kwargs": {
            "reverse_id": COURSE_SUBJECTS_PAGE_REVERSE_ID,
            "template": "richie/fullwidth.html",
        },
    },
    "organizations": {
        "content": {"en": "Organizations", "fr": "Etablissements"},
        "kwargs": {
            "reverse_id": ORGANIZATIONS_PAGE_REVERSE_ID,
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
    """Clear all CMS data (CMS models + organization page)"""

    cms_models.Page.objects.all().delete()
    cms_models.Title.objects.all().delete()
    cms_models.CMSPlugin.objects.all().delete()
    cms_models.Placeholder.objects.all().delete()
    OrganizationPage.objects.all().delete()
    Organization.objects.all().delete()


def create_cms_data():
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
    for i, _ in enumerate(range(NB_ORGANIZATIONS)):
        page = create_i18n_page(
            {
                "en": "Organization #{:d}".format(i),
                "fr": "Organisation #{:d}".format(i),
            },
            parent=pages_created["organizations"],
            published=True,
            site=site,
            template="organizations/cms/organization_detail.html",
        )
        organization = OrganizationFactory()
        OrganizationPage.objects.create(organization=organization, extended_object=page)


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
        create_cms_data()

        logger.info("done")
