"""
create_demo_site management command
"""
import logging
import random
from datetime import timedelta

from django.conf import settings
from django.contrib.sites.models import Site
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone, translation

from cms import models as cms_models

from richie.apps.courses.factories import (
    VIDEO_SAMPLE_LINKS,
    CourseFactory,
    CourseRunFactory,
    LicenceFactory,
    OrganizationFactory,
    SubjectFactory,
)
from richie.apps.courses.models import Course, Organization, Subject
from richie.apps.persons.factories import PersonFactory
from richie.apps.persons.models import Person

from ...helpers import recursive_page_creation

logger = logging.getLogger("richie.commands.core.create_demo_site")

DEMO_ANNEX_PAGE_ID = "annex"
NB_COURSES = 3
NB_COURSES_ORGANIZATION_RELATIONS = 3
NB_COURSES_SUBJECT_RELATIONS = 4
NB_COURSES_PERSONS_PLUGINS = 3
NB_ORGANIZATIONS = 8
NB_LICENCES = 5
NB_PERSONS = 10
NB_SUBJECTS = 8
PAGE_INFOS = {
    "home": {
        "content": {"en": "Home", "fr": "Accueil"},
        "in_navigation": False,
        "kwargs": {"template": "richie/fullwidth.html"},
    },
    "news": {
        "content": {"en": "News", "fr": "Actualités"},
        "in_navigation": True,
        "kwargs": {"template": "richie/fullwidth.html"},
    },
    "courses": {
        "content": {"en": "Courses", "fr": "Cours"},
        "in_navigation": True,
        "kwargs": {
            "reverse_id": Course.ROOT_REVERSE_ID,
            "template": "search/search.html",
        },
    },
    "subjects": {
        "content": {"en": "Subjects", "fr": "Sujets"},
        "in_navigation": False,
        "kwargs": {
            "reverse_id": Subject.ROOT_REVERSE_ID,
            "template": "richie/child_pages_list.html",
        },
    },
    "organizations": {
        "content": {"en": "Organizations", "fr": "Etablissements"},
        "in_navigation": True,
        "kwargs": {
            "reverse_id": Organization.ROOT_REVERSE_ID,
            "template": "richie/child_pages_list.html",
        },
    },
    "persons": {
        "content": {"en": "Persons", "fr": "Personnes"},
        "in_navigation": False,
        "kwargs": {
            "reverse_id": Person.ROOT_REVERSE_ID,
            "template": "richie/child_pages_list.html",
        },
    },
    "dashboard": {
        "content": {"en": "Dashboard", "fr": "Tableau de bord"},
        "in_navigation": False,
        "cms": False,
        "kwargs": {"template": "richie/fullwidth.html"},
    },
    "annex": {
        "content": {"en": "Annex", "fr": "Annexe"},
        "in_navigation": False,
        "kwargs": {
            "template": "richie/fullwidth.html",
            "reverse_id": DEMO_ANNEX_PAGE_ID,
        },
        "children": {
            "about": {
                "content": {"en": "About", "fr": "A propos"},
                "in_navigation": True,
                "kwargs": {"template": "richie/fullwidth.html"},
            }
        },
    },
}


def get_number_of_course_runs():
    """
    Returns a random integer between 1 and 5. We make it a convenience method so that it can
    be mocked in tests.
    """
    return random.randint(1, 5)


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
    Course.objects.all().delete()  # Deletes the associated course runs as well by cascading
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
    pages_created = recursive_page_creation(site, PAGE_INFOS)

    # Create some licences
    licences = LicenceFactory.create_batch(NB_LICENCES)

    # Create organizations under the `Organizations` page
    organizations = OrganizationFactory.create_batch(
        NB_ORGANIZATIONS,
        languages=[l[0] for l in settings.LANGUAGES],
        parent=pages_created["organizations"],
        fill_banner=True,
        fill_description=True,
        fill_logo=True,
        should_publish=True,
        in_navigation=True,
    )

    # Create subjects under the `Subjects` page
    subjects = SubjectFactory.create_batch(
        NB_SUBJECTS,
        languages=[l[0] for l in settings.LANGUAGES],
        parent=pages_created["subjects"],
        fill_banner=True,
        fill_description=True,
        fill_logo=True,
        should_publish=True,
        in_navigation=True,
    )

    # Django parler require a language to be manually set when working out of
    # request/response flow and PersonTitle use 'parler'
    translation.activate(settings.LANGUAGE_CODE)

    # Create persons under the `persons` page
    persons = PersonFactory.create_batch(
        NB_PERSONS,
        languages=[l[0] for l in settings.LANGUAGES],
        parent=pages_created["persons"],
        fill_portrait=True,
        fill_resume=True,
        should_publish=True,
        in_navigation=True,
    )

    # Create courses under the `Course` page with subjects and organizations
    # relations
    for _ in range(NB_COURSES):
        course_organizations = random.sample(
            organizations, NB_COURSES_ORGANIZATION_RELATIONS
        )
        video_sample = random.choice(VIDEO_SAMPLE_LINKS)

        course = CourseFactory(
            languages=[l[0] for l in settings.LANGUAGES],
            parent=pages_created["courses"],
            organization_main=random.choice(course_organizations),
            fill_licences=[
                ("course_license_content", random.choice(licences)),
                ("course_license_participation", random.choice(licences)),
            ],
            fill_team=random.sample(persons, NB_COURSES_PERSONS_PLUGINS),
            fill_teaser=video_sample,
            fill_cover=video_sample.image,
            fill_texts=[
                "course_syllabus",
                "course_format",
                "course_prerequisites",
                "course_plan",
                # "course_license_content",
                # "course_license_participation",
            ],
            with_organizations=course_organizations,
            with_subjects=random.sample(subjects, NB_COURSES_SUBJECT_RELATIONS),
            should_publish=True,
            in_navigation=True,
        )
        # Add a random number of course runs to the course
        # 1) Make sure we have one open for enrollment
        now = timezone.now()
        CourseRunFactory(
            course=course,
            start=now + timedelta(days=1),
            enrollment_start=now - timedelta(days=5),
            enrollment_end=now + timedelta(days=5),
        )
        # 2) Add more random course runs
        nb_course_runs = get_number_of_course_runs()
        if nb_course_runs > 0:
            CourseRunFactory.create_batch(nb_course_runs, course=course)


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
