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
from cms.models import StaticPlaceholder

from richie.apps.core.factories import create_text_plugin, image_getter
from richie.apps.core.helpers import recursive_page_creation
from richie.apps.courses.factories import (
    VIDEO_SAMPLE_LINKS,
    BlogPostFactory,
    CourseFactory,
    CourseRunFactory,
    LicenceFactory,
    OrganizationFactory,
    PersonFactory,
    ProgramFactory,
)

from ...defaults import (
    FOOTER_CONTENT,
    HOMEPAGE_CONTENT,
    ICONS_INFO,
    LEVELS_INFO,
    NB_OBJECTS,
    PAGES_INFO,
    PARTNERSHIPS_INFO,
    SINGLECOLUMN_CONTENT,
    SITEMAP_PAGE_PARAMS,
    SUBJECTS_INFO,
    TAGS_INFO,
)
from ...helpers import create_categories
from ...utils import pick_image

logger = logging.getLogger("richie.commands.demo.create_demo_site")


def get_number_of_course_runs():
    """
    Returns a random integer between 1 and the max number of course runs.
    We make it a convenience method so that it can be mocked in tests.
    """
    return random.randint(1, NB_OBJECTS["course_courseruns"])  # nosec


def get_number_of_icons():
    """
    Returns a random integer between 0 and the max number of course icons.
    0 is weighted to have as much chance to be chosen as all other numbers cumulated because
    we visually don't want all our courses to have an icon.
    We make it a convenience method so that it can be mocked in tests.
    """
    return random.choice(  # nosec
        [0] * NB_OBJECTS["course_icons"] + list(range(NB_OBJECTS["course_icons"]))
    )


# pylint: disable=no-member
#
# Looks like pylint is not relevant at guessing object types when cascading
# methods over querysets: Instance of 'list' has no 'delete' member (no-member).
# We choose to ignore this false positive warning.

# pylint: disable=too-many-locals,too-many-statements,too-many-branches
@override_settings(RICHIE_KEEP_SEARCH_UPDATED=False)
def create_demo_site():
    """
    Create a simple site tree structure for developpers to work in realistic environment.

    We create multilingual pages, add organizations under the related page and add
    plugins to each page.
    """
    site = Site.objects.get(id=1)
    site.domain = "localhost:8070"
    site.name = "Richie demonstration"
    site.save()

    # Create pages as described in PAGES_INFOS
    pages_created = recursive_page_creation(site, PAGES_INFO)

    # Create the footer links
    footer_static_ph = StaticPlaceholder.objects.get_or_create(code="footer")[0]
    for footer_placeholder in [footer_static_ph.draft, footer_static_ph.public]:
        for language, content in FOOTER_CONTENT.items():
            # Create root nest
            nest_root_plugin = add_plugin(
                footer_placeholder, plugin_type="NestedItemPlugin", language=language,
            )
            for footer_info in content:
                # Create the first level items for main columns
                nest_column_plugin = add_plugin(
                    footer_placeholder,
                    plugin_type="NestedItemPlugin",
                    language=language,
                    target=nest_root_plugin,
                    content=footer_info.get("title", ""),
                )

                # Create the second level items for links
                for item_info in footer_info.get("items", []):
                    if "internal_link" in item_info:
                        item_info = item_info.copy()
                        item_info["internal_link"] = pages_created[
                            item_info["internal_link"]
                        ]
                    add_plugin(
                        footer_placeholder,
                        plugin_type="LinkPlugin",
                        language=language,
                        target=nest_column_plugin,
                        **item_info,
                    )

    # Create some licences
    licences = LicenceFactory.create_batch(
        NB_OBJECTS["licences"], logo__file__from_path=pick_image("licence")()
    )

    # Generate each category tree and return a list of the leaf categories
    icons = list(
        create_categories(
            **ICONS_INFO,
            fill_banner=pick_image("banner"),
            fill_logo=pick_image("category_logo"),
            page_parent=pages_created["categories"],
        )
    )
    levels = list(
        create_categories(
            **LEVELS_INFO,
            fill_banner=pick_image("banner"),
            fill_logo=pick_image("category_logo"),
            page_parent=pages_created["categories"],
        )
    )
    subjects = list(
        create_categories(
            **SUBJECTS_INFO,
            fill_banner=pick_image("banner"),
            fill_logo=pick_image("category_logo"),
            page_parent=pages_created["categories"],
        )
    )
    partnerships = list(
        create_categories(
            **PARTNERSHIPS_INFO,
            fill_banner=pick_image("banner"),
            fill_logo=pick_image("category_logo"),
            page_parent=pages_created["categories"],
        )
    )
    tags = list(
        create_categories(
            **TAGS_INFO,
            fill_banner=pick_image("banner"),
            fill_logo=pick_image("category_logo"),
            page_parent=pages_created["categories"],
        )
    )

    # Create organizations under the `Organizations` page
    organizations = []
    for i in range(NB_OBJECTS["organizations"]):
        # Randomly assign each organization to a partnership level category
        organizations.append(
            OrganizationFactory(
                page_in_navigation=True,
                page_languages=["en", "fr"],
                page_parent=pages_created["organizations"],
                fill_banner=pick_image("banner"),
                fill_categories=[random.choice(partnerships)]  # nosec
                if (i % 2 == 0)
                else [],
                fill_description=True,
                fill_logo=pick_image("logo"),
                should_publish=True,
                with_permissions=True,
            )
        )

    # Create persons under the `persons` page
    persons = []
    persons_for_organization = defaultdict(list)
    for _ in range(NB_OBJECTS["persons"]):
        # Randomly assign each person to a set of organizations
        person_organizations = random.sample(
            organizations,
            random.randint(1, NB_OBJECTS["person_organizations"]),  # nosec
        )
        person = PersonFactory(
            page_in_navigation=True,
            page_languages=["en", "fr"],
            page_parent=pages_created["persons"],
            fill_categories=random.sample(
                subjects, random.randint(1, NB_OBJECTS["person_subjects"])  # nosec
            ),
            fill_organizations=person_organizations,
            fill_portrait=pick_image("portrait"),
            fill_bio=True,
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
        video_sample = random.choice(VIDEO_SAMPLE_LINKS)  # nosec

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
                ("course_license_content", random.choice(licences)),  # nosec
                ("course_license_participation", random.choice(licences)),  # nosec
            ],
            fill_team=random.sample(
                eligible_persons,
                min(
                    random.randint(1, NB_OBJECTS["course_persons"]),  # nosec
                    len(eligible_persons),
                ),
            ),
            fill_teaser=video_sample,
            fill_cover=pick_image("cover")(video_sample.image),
            fill_categories=[
                *random.sample(
                    subjects, random.randint(1, NB_OBJECTS["course_subjects"])  # nosec
                ),
                random.choice(levels),  # nosec
            ],
            fill_icons=random.sample(icons, get_number_of_icons()),
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
        course.create_permissions_for_organization(course_organizations[0])
        courses.append(course)

        # Add a random number of course runs to the course
        nb_course_runs = get_number_of_course_runs()
        # pick a subset of languages for this course (otherwise all courses will have more or
        # less all the languages across their course runs!)
        languages_subset = random.sample(
            ["de", "en", "es", "fr", "it", "nl"], random.randint(1, 4)  # nosec
        )
        for i in range(nb_course_runs):
            CourseRunFactory(
                __sequence=i,
                languages=random.sample(
                    languages_subset, random.randint(1, len(languages_subset))  # nosec
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
            page_parent=pages_created["blogposts"],
            fill_cover=pick_image("cover"),
            fill_excerpt=True,
            fill_body=True,
            fill_categories=[
                *random.sample(levels, NB_OBJECTS["blogpost_levels"]),
                *random.sample(tags, NB_OBJECTS["blogpost_tags"]),
            ],
            fill_author=random.sample(persons, 1),
            should_publish=True,
        )
        blogposts.append(post)

    # Create programs under the `Programs` page
    programs = []
    for _ in range(NB_OBJECTS["programs"]):
        program = ProgramFactory.create(
            page_in_navigation=True,
            page_languages=["en", "fr"],
            page_parent=pages_created["programs"],
            fill_cover=pick_image("cover"),
            fill_excerpt=True,
            fill_body=True,
            fill_courses=[*random.sample(courses, NB_OBJECTS["programs_courses"])],
            should_publish=True,
        )
        programs.append(program)

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
            internal_link=pages_created["blogposts"],
        )

        # Add highlighted programs
        programs_section = add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="SectionPlugin",
            title=content["programs_title"],
            template=content["section_template"],
        )
        for program in random.sample(programs, NB_OBJECTS["home_programs"]):
            add_plugin(
                language=language,
                placeholder=placeholder,
                plugin_type="ProgramPlugin",
                target=programs_section,
                page=program.extended_object,
            )
        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="LinkPlugin",
            target=programs_section,
            name=content["programs_button_title"],
            template=content["button_template_name"],
            internal_link=pages_created["programs"],
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
    video_sample = random.choice(VIDEO_SAMPLE_LINKS)  # nosec

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
            nb_paragraphs=random.randint(3, 4),  # nosec
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
            page=random.choice(organizations).extended_object,  # nosec
        )
        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="CoursePlugin",
            target=sample_section,
            page=random.choice(courses).extended_object,  # nosec
        )
        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="OrganizationPlugin",
            target=sample_section,
            page=random.choice(organizations).extended_object,  # nosec
        )
        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="BlogPostPlugin",
            target=sample_section,
            page=random.choice(blogposts).extended_object,  # nosec
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
            licence=random.choice(licences),  # nosec
        )
        # Add a simple picture entry
        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="SimplePicturePlugin",
            picture=logo,
        )
        # Add a plain text
        text = factory.Faker(
            "text", max_nb_chars=random.randint(150, 250), locale=language  # nosec
        ).generate({})
        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body=text,
        )

        # Once content has been added we must publish again the about page
        pages_created["annex__about"].publish(language)

    # Create a sitemap page
    placeholder = pages_created["annex__sitemap"].placeholders.get(slot="maincontent")

    for language in pages_created["annex__sitemap"].get_languages():
        parent_instance = add_plugin(
            language=language, placeholder=placeholder, plugin_type="HTMLSitemapPlugin"
        )
        for name, params in SITEMAP_PAGE_PARAMS.items():
            add_plugin(
                language=language,
                placeholder=placeholder,
                plugin_type="HTMLSitemapPagePlugin",
                target=parent_instance,
                root_page=pages_created[name],
                **params,
            )

        # Once content has been added we must publish again the sitemap
        pages_created["annex__sitemap"].publish(language)


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
