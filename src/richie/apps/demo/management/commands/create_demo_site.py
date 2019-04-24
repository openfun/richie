"""Create_demo_site management command."""
import logging
import random
from collections import defaultdict

from django.conf import settings
from django.contrib.sites.models import Site
from django.core.management.base import BaseCommand, CommandError
from django.test.utils import override_settings

import factory
from cms.api import add_plugin

from richie.apps.core.factories import image_getter
from richie.apps.core.helpers import create_text_plugin
from richie.apps.courses.factories import (
    VIDEO_SAMPLE_LINKS,
    BlogPostFactory,
    CourseFactory,
    CourseRunFactory,
    LicenceFactory,
    OrganizationFactory,
    PersonFactory,
    PersonTitleFactory,
    PersonTitleTranslationFactory,
)

from ...defaults import (
    HOMEPAGE_CONTENT,
    LEVELS_INFO,
    NB_OBJECTS,
    PAGES_INFO,
    SINGLECOLUMN_CONTENT,
    SUBJECTS_INFO,
)
from ...helpers import create_categories, recursive_page_creation
from ...utils import pick_image

logger = logging.getLogger("richie.commands.core.create_demo_site")


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

# pylint: disable=too-many-locals,too-many-statements
@override_settings(RICHIE_KEEP_SEARCH_UPDATED=False)
def create_demo_site():
    """
    Create a simple site tree structure for developpers to work in realistic environment.

    We create multilingual pages, add organizations under the related page and add
    plugins to each page.
    """
    site = Site.objects.get(id=1)

    # Create pages as described in PAGES_INFOS
    pages_created = recursive_page_creation(site, PAGES_INFO)

    # Create some licences
    licences = LicenceFactory.create_batch(
        NB_OBJECTS["licences"], logo__file__from_path=pick_image("licence")()
    )

    # Create organizations under the `Organizations` page
    organizations = OrganizationFactory.create_batch(
        NB_OBJECTS["organizations"],
        page_in_navigation=True,
        page_languages=["en", "fr"],
        page_parent=pages_created["organizations"],
        fill_banner=pick_image("banner"),
        fill_description=True,
        fill_logo=pick_image("logo"),
        should_publish=True,
    )

    # Generate each category tree and return a list of the leaf categories
    levels = list(
        create_categories(
            LEVELS_INFO,
            pages_created["categories"],
            reverse_id="levels",
            fill_banner=pick_image("banner"),
            fill_logo=pick_image("logo"),
        )
    )
    subjects = list(
        create_categories(
            SUBJECTS_INFO,
            pages_created["categories"],
            reverse_id="subjects",
            fill_banner=pick_image("banner"),
            fill_logo=pick_image("logo"),
        )
    )

    title = PersonTitleFactory(translation=None)
    PersonTitleTranslationFactory(
        master=title, language_code="en", title="Doctor", abbreviation="Dr."
    )
    PersonTitleTranslationFactory(
        master=title, language_code="fr", title="Docteur", abbreviation="Dr."
    )

    # Create persons under the `persons` page
    persons = []
    persons_for_organization = defaultdict(list)
    for _ in range(NB_OBJECTS["persons"]):
        # Randomly assign each person to a set of organizations
        person_organizations = random.sample(
            organizations, random.randint(1, NB_OBJECTS["person_organizations"])
        )
        person = PersonFactory(
            page_in_navigation=True,
            page_languages=["en", "fr"],
            page_parent=pages_created["persons"],
            person_title=random.choice([title, None]),
            fill_categories=random.sample(
                subjects, random.randint(1, NB_OBJECTS["person_subjects"])
            ),
            fill_organizations=person_organizations,
            fill_portrait=pick_image("portrait"),
            fill_resume=True,
            should_publish=True,
        )
        persons.append(person)
        for organization in person_organizations:
            persons_for_organization[organization.id].append(person)

    # Assign each person randomly to an organization so that our course are tagged realistically
    # If organizations and persons are tagged randomly on courses, each organizations will
    # in the end be related to most persons... not what we want.

    # Create courses under the `Course` page with categories and organizations
    # relations
    courses = []
    for _ in range(NB_OBJECTS["courses"]):
        video_sample = random.choice(VIDEO_SAMPLE_LINKS)

        # Randomly assign each course to a set of organizations
        course_organizations = random.sample(
            organizations, NB_OBJECTS["course_organizations"]
        )

        # Only the persons members of these organizations are eligible to be part
        # of the course team
        eligible_persons = set(
            person
            for o in course_organizations
            for person in persons_for_organization[o.id]
        )

        course = CourseFactory(
            page_in_navigation=True,
            page_languages=["en", "fr"],
            page_parent=pages_created["courses"],
            fill_licences=[
                ("course_license_content", random.choice(licences)),
                ("course_license_participation", random.choice(licences)),
            ],
            fill_team=random.sample(
                eligible_persons,
                min(
                    random.randint(1, NB_OBJECTS["course_persons"]),
                    len(eligible_persons),
                ),
            ),
            fill_teaser=video_sample,
            fill_cover=pick_image("cover")(video_sample.image),
            fill_categories=[
                *random.sample(
                    subjects, random.randint(1, NB_OBJECTS["course_subjects"])
                ),
                random.choice(levels),
            ],
            fill_organizations=course_organizations,
            fill_texts=[
                "course_description",
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
        # pick a subset of languages for this course (otherwise all courses will have more or
        # less all the languages across their course runs!)
        languages_subset = random.sample(
            ["de", "en", "es", "fr", "it", "nl"], random.randint(1, 4)
        )
        for i in range(nb_course_runs):
            CourseRunFactory(
                __sequence=i,
                languages=random.sample(
                    languages_subset, random.randint(1, len(languages_subset))
                ),
                page_in_navigation=False,
                page_languages=["en", "fr"],
                page_parent=course.extended_object,
                should_publish=True,
            )

    # Create blog posts under the `News` page
    blogposts = []
    for _ in range(NB_OBJECTS["blogposts"]):
        post = BlogPostFactory.create(
            page_in_navigation=True,
            page_languages=["en", "fr"],
            page_parent=pages_created["news"],
            fill_cover=pick_image("cover"),
            fill_excerpt=True,
            fill_body=True,
            fill_categories=[
                *random.sample(subjects, NB_OBJECTS["blogpost_categories"]),
                random.choice(levels),
            ],
            fill_author=random.sample(persons, 1),
            should_publish=True,
        )
        blogposts.append(post)

    # Once everything has been created, use some content to create a homepage
    placeholder = pages_created["home"].placeholders.get(slot="maincontent")

    # - Get a banner image
    banner = image_getter(pick_image("banner")())

    # - Get a logo image
    logo = image_getter(pick_image("logo")())

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
        # Add highlighted courses with a button
        courses_section = add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="SectionPlugin",
            title=content["courses_title"],
            template=content["section_template"],
        )
        for course in random.sample(courses, NB_OBJECTS["home_courses"]):
            add_plugin(
                language=language,
                placeholder=placeholder,
                plugin_type="CoursePlugin",
                target=courses_section,
                page=course.extended_object,
            )
        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="LinkPlugin",
            target=courses_section,
            name=content["courses_button_title"],
            template=content["button_template_name"],
            internal_link=pages_created["courses"],
        )

        # Add highlighted blogposts
        blogposts_section = add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="SectionPlugin",
            title=content["blogposts_title"],
            template=content["section_template"],
        )
        for blogpost in random.sample(blogposts, NB_OBJECTS["home_blogposts"]):
            add_plugin(
                language=language,
                placeholder=placeholder,
                plugin_type="BlogPostPlugin",
                target=blogposts_section,
                page=blogpost.extended_object,
            )
        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="LinkPlugin",
            target=blogposts_section,
            name=content["blogposts_button_title"],
            template=content["button_template_name"],
            internal_link=pages_created["news"],
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
            organizations, NB_OBJECTS["home_organizations"]
        ):
            add_plugin(
                language=language,
                placeholder=placeholder,
                plugin_type="OrganizationPlugin",
                target=organizations_section,
                page=organization.extended_object,
            )
        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="LinkPlugin",
            target=organizations_section,
            name=content["organizations_button_title"],
            template=content["button_template_name"],
            internal_link=pages_created["organizations"],
        )

        # Add highlighted subjects
        subjects_section = add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="SectionPlugin",
            title=content["subjects_title"],
            template=content["section_template"],
        )
        for subject in random.sample(subjects, NB_OBJECTS["home_subjects"]):
            add_plugin(
                language=language,
                placeholder=placeholder,
                plugin_type="CategoryPlugin",
                target=subjects_section,
                page=subject.extended_object,
            )
        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="LinkPlugin",
            target=subjects_section,
            name=content["subjects_button_title"],
            template=content["button_template_name"],
            internal_link=pages_created["categories"],
        )

        # Add highlighted persons
        persons_section = add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="SectionPlugin",
            title=content["persons_title"],
            template=content["section_template"],
        )
        for person in random.sample(persons, NB_OBJECTS["home_persons"]):
            add_plugin(
                language=language,
                placeholder=placeholder,
                plugin_type="PersonPlugin",
                target=persons_section,
                page=person.extended_object,
            )
        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="LinkPlugin",
            target=persons_section,
            name=content["persons_button_title"],
            template=content["button_template_name"],
            internal_link=pages_created["persons"],
        )

        # Once content has been added we must publish again homepage
        pages_created["home"].publish(language)

    # Fill the single column sample page
    placeholder = pages_created["annex__about"].placeholders.get(slot="maincontent")

    # - Get a banner image
    banner = image_getter(pick_image("banner")())

    # - Get a logo image
    logo = image_getter(pick_image("logo")())

    # - Get a video
    video_sample = random.choice(VIDEO_SAMPLE_LINKS)

    # - Create sample page in each language
    for language, content in SINGLECOLUMN_CONTENT.items():
        # Add a banner
        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="LargeBannerPlugin",
            title=content["banner_title"],
            background_image=banner,
            content=content["banner_content"],
            template=content["banner_template"],
        )
        # HTML paragraphs
        create_text_plugin(
            pages_created["annex__about"],
            placeholder,
            nb_paragraphs=random.randint(3, 4),
            languages=[language],
            plugin_type="TextPlugin",
        )
        # A large video sample
        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="VideoPlayerPlugin",
            label=video_sample.label,
            embed_link=video_sample.url,
            template="full-width",
        )
        # Section with some various plugins
        sample_section = add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="SectionPlugin",
            title=content["section_sample_title"],
            template=content["section_sample_template"],
        )
        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="OrganizationPlugin",
            target=sample_section,
            page=random.choice(organizations).extended_object,
        )
        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="CoursePlugin",
            target=sample_section,
            page=random.choice(courses).extended_object,
        )
        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="OrganizationPlugin",
            target=sample_section,
            page=random.choice(organizations).extended_object,
        )
        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="BlogPostPlugin",
            target=sample_section,
            page=random.choice(blogposts).extended_object,
        )
        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="LinkPlugin",
            target=sample_section,
            name=content["section_sample_button_title"],
            template=content["button_template_name"],
            internal_link=pages_created["home"],
        )
        # Add a licence
        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="LicencePlugin",
            licence=random.choice(licences),
        )
        # Add a simple picture entry
        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="PicturePlugin",
            picture=logo,
            attributes={"alt": "sample logo"},
            alignment="center",
        )
        # Add a plain text
        text = factory.Faker(
            "text", max_nb_chars=random.randint(150, 250), locale=language
        ).generate({})
        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body=text,
        )

        # Once content has been added we must publish again homepage
        pages_created["annex__about"].publish(language)


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

        create_demo_site()

        logger.info("done")
