"""
create_demo_site management command
"""
import logging
import random
from datetime import timedelta

from django.conf import settings
from django.contrib.sites.models import Site
from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from cms import models as cms_models
from cms.api import add_plugin
from filer.models.imagemodels import Image

from richie.apps.courses.factories import (
    VIDEO_SAMPLE_LINKS,
    CourseFactory,
    CourseRunFactory,
    LicenceFactory,
    OrganizationFactory,
)
from richie.apps.courses.helpers import create_categories
from richie.apps.courses.models import Category, Course, Licence, Organization
from richie.apps.persons.factories import (
    PersonFactory,
    PersonTitleFactory,
    PersonTitleTranslationFactory,
)
from richie.apps.persons.models import Person, PersonTitle, PersonTitleTranslation

from ...helpers import recursive_page_creation
from ...utils import file_getter

logger = logging.getLogger("richie.commands.core.create_demo_site")

DEMO_ANNEX_PAGE_ID = "annex"
NB_COURSES = 30
NB_COURSES_ORGANIZATION_RELATIONS = 3
NB_COURSES_PERSONS_PLUGINS = 3
NB_COURSES_SUBJECT_RELATIONS = 2
NB_ORGANIZATIONS = 5
NB_LICENCES = 5
NB_PERSONS = 10
NB_HOME_HIGHLIGHTED_COURSES = 8
NB_HOME_HIGHLIGHTED_ORGANIZATIONS = 4
NB_HOME_HIGHLIGHTED_SUBJECTS = 6
NB_HOME_HIGHLIGHTED_PERSONS = 3
PAGE_INFOS = {
    "home": {
        "title": {"en": "Home", "fr": "Accueil"},
        "in_navigation": False,
        "kwargs": {"template": "richie/homepage.html"},
    },
    "news": {
        "title": {"en": "News", "fr": "Actualités"},
        "in_navigation": True,
        "kwargs": {"template": "richie/fullwidth.html"},
    },
    "courses": {
        "title": {"en": "Courses", "fr": "Cours"},
        "in_navigation": True,
        "kwargs": {
            "reverse_id": Course.ROOT_REVERSE_ID,
            "template": "search/search.html",
        },
    },
    "categories": {
        "title": {"en": "Categories", "fr": "Catégories"},
        "in_navigation": False,
        "kwargs": {
            "reverse_id": Category.ROOT_REVERSE_ID,
            "template": "richie/child_pages_list.html",
        },
    },
    "organizations": {
        "title": {"en": "Organizations", "fr": "Etablissements"},
        "in_navigation": True,
        "kwargs": {
            "reverse_id": Organization.ROOT_REVERSE_ID,
            "template": "courses/cms/organization_list.html",
        },
    },
    "persons": {
        "title": {"en": "Persons", "fr": "Personnes"},
        "in_navigation": False,
        "kwargs": {
            "reverse_id": Person.ROOT_REVERSE_ID,
            "template": "richie/child_pages_list.html",
        },
    },
    "dashboard": {
        "title": {"en": "Dashboard", "fr": "Tableau de bord"},
        "in_navigation": False,
        "cms": False,
        "kwargs": {"template": "richie/fullwidth.html"},
    },
    "annex": {
        "title": {"en": "Annex", "fr": "Annexe"},
        "in_navigation": False,
        "kwargs": {
            "template": "richie/fullwidth.html",
            "reverse_id": DEMO_ANNEX_PAGE_ID,
        },
        "children": {
            "annex__about": {
                "title": {"en": "About", "fr": "A propos"},
                "in_navigation": True,
                "kwargs": {"template": "richie/fullwidth.html"},
            }
        },
    },
}
LEVELS_INFO = {
    "title": {"en": "Level", "fr": "Niveau"},
    "children": [
        {"title": {"en": "Beginner", "fr": "Débutant"}},
        {"title": {"en": "Advanced", "fr": "Avancé"}},
        {"title": {"en": "Expert", "fr": "Expert"}},
    ],
}
SUBJECTS_INFO = {
    "title": {"en": "Subject", "fr": "Subjet"},
    "children": [
        {
            "title": {"en": "Science", "fr": "Sciences"},
            "children": [
                {
                    "title": {
                        "en": "Agronomy and Agriculture",
                        "fr": "Agronomie et Agriculture",
                    }
                },
                {"title": {"en": "Chemistry", "fr": "Chimie"}},
                {
                    "title": {
                        "en": "Discovery of the Universe",
                        "fr": "Découverte de l'Univers",
                    }
                },
                {"title": {"en": "Environment", "fr": "Environnement"}},
                {
                    "title": {
                        "en": "Mathematics and Statistics",
                        "fr": "Mathématiques et Statistiques",
                    }
                },
                {
                    "title": {
                        "en": "Tools for Research",
                        "fr": "Outils pour la Recherche",
                    }
                },
                {"title": {"en": "Physics", "fr": "Physique"}},
                {"title": {"en": "Cognitive science", "fr": "Sciences cognitives"}},
                {
                    "title": {
                        "en": "Earth science and science of the Universe",
                        "fr": "Sciences de la Terre et de l'Univers",
                    }
                },
                {"title": {"en": "Life science", "fr": "Sciences de la vie"}},
                {
                    "title": {
                        "en": "Engineering science",
                        "fr": "Sciences pour l'ingénieur",
                    }
                },
            ],
        },
        {
            "title": {
                "en": "Human and social sciences",
                "fr": "Sciences humaines et social",
            },
            "children": [
                {"title": {"en": "Communication", "fr": "Communication"}},
                {
                    "title": {
                        "en": "Creation, Arts and Design",
                        "fr": "Création, Arts et Design",
                    }
                },
                {
                    "title": {
                        "en": "Culture and Civilization",
                        "fr": "Cultures et Civilisations",
                    }
                },
                {
                    "title": {
                        "en": "Social Issues and Social Policy",
                        "fr": "Enjeux de société",
                    }
                },
                {"title": {"en": "Geography", "fr": "Géographie"}},
                {"title": {"en": "History", "fr": "Histoire"}},
                {"title": {"en": "Innovation", "fr": "Innovation"}},
                {"title": {"en": "Literature", "fr": "Lettres"}},
                {"title": {"en": "Media", "fr": "Médias"}},
                {"title": {"en": "Philosophy", "fr": "Philosophie"}},
                {"title": {"en": "Political science", "fr": "Sciences politiques"}},
                {
                    "title": {
                        "en": "International relations",
                        "fr": "Relations internationales",
                    }
                },
                {"title": {"en": "Sports", "fr": "Sport"}},
            ],
        },
        {"title": {"en": "Law", "fr": "Droit et juridique"}},
        {"title": {"en": "Economy and Finance", "fr": "Economie et Finance"}},
        {"title": {"en": "Education and Training", "fr": "Education et formation"}},
        {"title": {"en": "Management", "fr": "Management"}},
        {"title": {"en": "Entrepreneurship", "fr": "Entreprenariat"}},
        {
            "title": {"en": "Computer science", "fr": "Informatique"},
            "children": [
                {
                    "title": {
                        "en": "Digital and Technology",
                        "fr": "Numérique et Technologie",
                    }
                },
                {
                    "title": {
                        "en": "Telecommunication and Networks",
                        "fr": "Télécommunications et Réseaux",
                    }
                },
                {"title": {"en": "Coding", "fr": "Programmation"}},
            ],
        },
        {"title": {"en": "Languages", "fr": "Langues"}},
        {"title": {"en": "Education and career guidance", "fr": "Orientation"}},
        {"title": {"en": "Health", "fr": "Santé"}},
    ],
}
HOMEPAGE_CONTENT = {
    "en": {
        "banner_title": "Welcome to Richie",
        "banner_content": "It works! This is the default homepage for the Richie CMS.",
        "banner_template": "richie/large_banner/hero-intro.html",
        "section_template": "richie/section/highlighted_items.html",
        "courses_title": "Popular courses",
        "organizations_title": "Universities",
        "persons_title": "Persons",
        "subjects_title": "Subjects",
    },
    "fr": {
        "banner_title": "Bienvenue sur Richie",
        "banner_content": "Ça marche ! Ceci est la page d'accueil par défaut du CMS Richie.",
        "banner_template": "richie/large_banner/hero-intro.html",
        "section_template": "richie/section/highlighted_items.html",
        "courses_title": "Cours à la une",
        "organizations_title": "Universités",
        "subjects_title": "Thématiques",
        "persons_title": "Personnes",
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
    Category.objects.all().delete()
    Person.objects.all().delete()
    PersonTitle.objects.all().delete()
    PersonTitleTranslation.objects.all().delete()
    Licence.objects.all().delete()


# pylint: disable=too-many-locals
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
        page_in_navigation=True,
        page_languages=["en", "fr"],
        page_parent=pages_created["organizations"],
        fill_banner=True,
        fill_description=True,
        fill_logo=True,
        should_publish=True,
    )

    # Generate each category tree and return a list of the leaf categories
    levels = list(create_categories(LEVELS_INFO, pages_created["categories"]))
    subjects = list(create_categories(SUBJECTS_INFO, pages_created["categories"]))

    title = PersonTitleFactory(translation=None)
    PersonTitleTranslationFactory(
        master=title, language_code="en", title="Doctor", abbreviation="Dr."
    )
    PersonTitleTranslationFactory(
        master=title, language_code="fr", title="Docteur", abbreviation="Dr."
    )

    # Create persons under the `persons` page
    persons = PersonFactory.create_batch(
        NB_PERSONS,
        page_in_navigation=True,
        page_languages=["en", "fr"],
        page_parent=pages_created["persons"],
        person_title=random.choice([title, None]),
        fill_portrait=True,
        fill_resume=True,
        should_publish=True,
    )

    # Create courses under the `Course` page with categories and organizations
    # relations
    courses = []
    for _ in range(NB_COURSES):
        video_sample = random.choice(VIDEO_SAMPLE_LINKS)

        course = CourseFactory(
            page_in_navigation=True,
            page_languages=["en", "fr"],
            page_parent=pages_created["courses"],
            fill_licences=[
                ("course_license_content", random.choice(licences)),
                ("course_license_participation", random.choice(licences)),
            ],
            fill_team=random.sample(persons, NB_COURSES_PERSONS_PLUGINS),
            fill_teaser=video_sample,
            fill_cover=video_sample.image,
            fill_categories=[
                *random.sample(
                    subjects, random.randint(1, NB_COURSES_SUBJECT_RELATIONS)
                ),
                random.choice(levels),
            ],
            fill_organizations=random.sample(
                organizations, NB_COURSES_ORGANIZATION_RELATIONS
            ),
            fill_texts=[
                "course_syllabus",
                "course_format",
                "course_prerequisites",
                "course_plan",
                # "course_license_content",
                # "course_license_participation",
            ],
            should_publish=True,
        )
        courses.append(course)

        # Add a random number of course runs to the course
        nb_course_runs = get_number_of_course_runs()

        # 1) Make sure we have one course run open for enrollment
        now = timezone.now()
        CourseRunFactory(
            __sequence=nb_course_runs,
            page_in_navigation=False,
            page_parent=course.extended_object,
            start=now + timedelta(days=1),
            enrollment_start=now - timedelta(days=5),
            enrollment_end=now + timedelta(days=5),
            should_publish=True,
        )

        # 2) Add more random course runs
        for i in range(nb_course_runs - 1, 0, -1):
            CourseRunFactory(
                __sequence=i,
                page_in_navigation=False,
                page_languages=["en", "fr"],
                page_parent=course.extended_object,
                should_publish=True,
            )

    # Once everything has been created, use some content to create a homepage
    placeholder = pages_created["home"].placeholders.get(slot="maincontent")

    # - Get a banner image
    banner_file = file_getter("banner")()
    wrapped_banner = File(banner_file, banner_file.name)
    banner = Image.objects.create(file=wrapped_banner)

    # - Get a logo image
    logo_file = file_getter("logo")()
    wrapped_logo = File(logo_file, logo_file.name)
    logo = Image.objects.create(file=wrapped_logo)

    # - Create the home page in each language
    for language, content in HOMEPAGE_CONTENT.items():
        # Add a banner
        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="LargeBannerPlugin",
            title=content["banner_title"],
            background_image=banner,
            logo=logo,
            logo_alt_text="logo",
            content=content["banner_content"],
            template=content["banner_template"],
        )
        # Add highlighted courses
        courses_section = add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="SectionPlugin",
            title=content["courses_title"],
            template=content["section_template"],
        )
        for course in random.sample(courses, NB_HOME_HIGHLIGHTED_COURSES):
            add_plugin(
                language=language,
                placeholder=placeholder,
                plugin_type="CoursePlugin",
                target=courses_section,
                page=course.extended_object,
            )

        # Add highlighted organizations
        organizations_section = add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="SectionPlugin",
            title=content["organizations_title"],
            template=content["section_template"],
        )
        for organization in random.sample(
            organizations, NB_HOME_HIGHLIGHTED_ORGANIZATIONS
        ):
            add_plugin(
                language=language,
                placeholder=placeholder,
                plugin_type="OrganizationPlugin",
                target=organizations_section,
                page=organization.extended_object,
            )

        # Add highlighted subjects
        subjects_section = add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="SectionPlugin",
            title=content["subjects_title"],
            template=content["section_template"],
        )
        for subject in random.sample(subjects, NB_HOME_HIGHLIGHTED_SUBJECTS):
            add_plugin(
                language=language,
                placeholder=placeholder,
                plugin_type="CategoryPlugin",
                target=subjects_section,
                page=subject.extended_object,
            )

        # Add highlighted persons
        persons_section = add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="SectionPlugin",
            title=content["persons_title"],
            template=content["section_template"],
        )
        for person in random.sample(persons, NB_HOME_HIGHLIGHTED_PERSONS):
            add_plugin(
                language=language,
                placeholder=placeholder,
                plugin_type="PersonPlugin",
                target=persons_section,
                page=person.extended_object,
            )

        # Once content has been added we must publish again homepage in every
        # edited Languages
        pages_created["home"].publish("en")
        pages_created["home"].publish("fr")


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
