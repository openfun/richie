# pylint: disable=no-member,too-many-locals,too-many-statements,too-many-branches,duplicate-code
# pylint: disable=missing-function-docstring,too-many-arguments,too-many-positional-arguments
# pylint: disable=too-many-lines,unused-argument
"""Create_dev_data management command."""

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
from richie.apps.courses import factories
from richie.apps.demo import defaults
from richie.apps.demo.defaults import set_labels_by_language
from richie.apps.demo.helpers import create_categories
from richie.apps.demo.utils import pick_image
from richie.plugins.glimpse import defaults as glimpse_defaults
from richie.plugins.glimpse.factories import GlimpseFactory

logger = logging.getLogger("richie.commands.demo.create_dev_data")

NB_OBJECTS = {
    "courses": 2,
    "course_courseruns": 1,
    "course_icons": 1,
    "course_organizations": 1,
    "course_persons": 1,
    "course_subjects": 1,
    "person_organizations": 1,
    "person_subjects": 1,
    "organizations": 1,
    "licences": 1,
    "persons": 1,
    "blogposts": 1,
    "blogpost_levels": 1,
    "blogpost_tags": 1,
    "programs": 1,
    "programs_courses": 1,
    "programs_organizations": 1,
    "programs_categories": 1,
    "programs_persons": 1,
    "home_blogposts": 1,
    "home_courses": 1,
    "home_organizations": 1,
    "home_subjects": 1,
    "home_persons": 1,
    "home_programs": 1,
}

PAGES_INFO = {
    "home": {
        "title": set_labels_by_language("Home"),
        "in_navigation": False,
        "is_homepage": True,
        "template": "richie/homepage.html",
    },
    "blogposts": {
        "title": set_labels_by_language("News"),
        "in_navigation": True,
        "template": "courses/cms/blogpost_list.html",
    },
    "courses": {
        "title": set_labels_by_language("Courses"),
        "in_navigation": True,
        "template": "search/search.html",
    },
    "categories": {
        "title": set_labels_by_language("Categories"),
        "in_navigation": True,
        "template": "courses/cms/category_list.html",
    },
    "organizations": {
        "title": set_labels_by_language("Organizations"),
        "in_navigation": True,
        "template": "courses/cms/organization_list.html",
    },
    "persons": {
        "title": set_labels_by_language("Persons"),
        "in_navigation": True,
        "template": "courses/cms/person_list.html",
    },
    "programs": {
        "title": set_labels_by_language("Programs"),
        "in_navigation": True,
        "template": "courses/cms/program_list.html",
    },
    "annex": {
        "title": set_labels_by_language("Annex"),
        "in_navigation": False,
        "template": "richie/single_column.html",
        "children": {
            "annex__about": {
                "title": set_labels_by_language("About"),
                "in_navigation": True,
                "template": "richie/single_column.html",
            },
            "annex__sitemap": {
                "title": set_labels_by_language("Sitemap"),
                "in_navigation": True,
                "template": "richie/single_column.html",
            },
            "login-error": {
                "title": set_labels_by_language("Login error"),
                "in_navigation": False,
                "template": "richie/single_column.html",
            },
        },
    },
}

LEVELS_INFO = {
    "page_title": set_labels_by_language("Level"),
    "children": [
        {"page_title": set_labels_by_language("Beginner")},
        {"page_title": set_labels_by_language("Advanced")},
        {"page_title": set_labels_by_language("Expert")},
    ],
    "page_reverse_id": "levels",
}

PARTNERSHIPS_INFO = {
    "page_title": set_labels_by_language("Partnership"),
    "children": [
        {"page_title": set_labels_by_language("Gold")},
        {"page_title": set_labels_by_language("Silver")},
        {"page_title": set_labels_by_language("Bronze")},
    ],
    "page_reverse_id": "partnerships",
}

TAGS_INFO = {
    "page_title": set_labels_by_language("Tag"),
    "children": [
        {"page_title": set_labels_by_language("Event")},
        {"page_title": set_labels_by_language("Feature")},
        {"page_title": set_labels_by_language("Around the course")},
        {"page_title": set_labels_by_language("Partner")},
        {"page_title": set_labels_by_language("Portrait")},
        {"page_title": set_labels_by_language("Recruitment")},
    ],
    "page_reverse_id": "tags",
}

SUBJECTS_INFO = {
    "page_title": set_labels_by_language("Subject"),
    "children": [
        {
            "page_title": set_labels_by_language("Science"),
            "children": [
                {"page_title": set_labels_by_language("Agronomy and Agriculture")},
                {"page_title": set_labels_by_language("Chemistry")},
                {"page_title": set_labels_by_language("Discovery of the Universe")},
                {"page_title": set_labels_by_language("Environment")},
            ],
        },
        {
            "page_title": set_labels_by_language("Human and social sciences"),
            "children": [
                {"page_title": set_labels_by_language("Communication")},
                {"page_title": set_labels_by_language("Creation, Arts and Design")},
                {"page_title": set_labels_by_language("Culture and Civilization")},
                {
                    "page_title": set_labels_by_language(
                        "Social Issues and Social Policy"
                    )
                },
                {"page_title": set_labels_by_language("Geography")},
                {"page_title": set_labels_by_language("History")},
            ],
        },
        {"page_title": set_labels_by_language("Law")},
        {"page_title": set_labels_by_language("Economy and Finance")},
        {"page_title": set_labels_by_language("Education and Training")},
    ],
    "page_reverse_id": "subjects",
}

ICONS_INFO = {
    "page_title": set_labels_by_language("Icons"),
    "children": [
        {
            "page_title": set_labels_by_language("Academic"),
            "color": "#005c08",
            "fill_icon": pick_image("icons")("academic.png"),
        },
        {
            "page_title": set_labels_by_language("Accessible"),
            "color": "#00a1d6",
            "fill_icon": pick_image("icons")("accessible.png"),
        },
        {
            "page_title": set_labels_by_language("Closed caption"),
            "color": "#a11000",
            "fill_icon": pick_image("icons")("cc.png"),
        },
        {
            "page_title": set_labels_by_language("Certificate"),
            "color": "#ffc400",
            "fill_icon": pick_image("icons")("certificate.png"),
        },
        {
            "page_title": set_labels_by_language("Subtitles"),
            "color": "#6d00ba",
            "fill_icon": pick_image("icons")("subtitles.png"),
        },
    ],
    "page_reverse_id": "icons",
}


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


def get_internal_link(page):
    """
    Returns the internal link for a given page.
    """
    return f"cms.page:{page.id}"


def create_homepage(
    blogposts,
    courses,
    licences,
    log,
    organizations,
    pages_created,
    persons,
    programs,
    subjects,
):
    """
    Create the homepage and fill it with content.
    """
    placeholder = pages_created["home"].placeholders.get(slot="maincontent")
    # - Get a banner image
    banner = image_getter(pick_image("banner")())
    # - Get a logo image
    logo = image_getter(pick_image("logo")())
    # - Create the home page in each language
    for language, content in defaults.HOMEPAGE_CONTENT.items():
        log(f"Creating content for {language}...")
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
            link={"internal_link": get_internal_link(pages_created["courses"])},
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
            link={"internal_link": get_internal_link(pages_created["blogposts"])},
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
            link={"internal_link": get_internal_link(pages_created["programs"])},
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
            link={"internal_link": get_internal_link(pages_created["organizations"])},
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
            link={"internal_link": get_internal_link(pages_created["categories"])},
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
            link={"internal_link": get_internal_link(pages_created["persons"])},
        )

        # Add Glimpse quotes with empty title
        quotes_section = add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="SectionPlugin",
            title="",
        )
        for _i in range(3):
            glimpse_data = factory.build(
                dict,
                FACTORY_CLASS=GlimpseFactory,
                variant=glimpse_defaults.QUOTE,
                title=None,
                image=image_getter(pick_image("portrait")()),
            )
            glimpse_data["image"].save()
            add_plugin(
                language=language,
                placeholder=placeholder,
                plugin_type="GlimpsePlugin",
                target=quotes_section,
                **glimpse_data,
            )

        # Add Glimpse cards with empty content
        cards_section = add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="SectionPlugin",
            title="",
        )
        for _i in range(4):
            glimpse_data = factory.build(
                dict,
                FACTORY_CLASS=GlimpseFactory,
                variant=glimpse_defaults.CARD_SQUARE,
                content=None,
                image=image_getter(pick_image("cover")()),
            )
            glimpse_data["image"].save()
            add_plugin(
                language=language,
                placeholder=placeholder,
                plugin_type="GlimpsePlugin",
                target=cards_section,
                **glimpse_data,
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
    video_sample = random.choice(factories.VIDEO_SAMPLE_LINKS)  # nosec
    # - Create sample page in each language
    for language, content in defaults.SINGLECOLUMN_CONTENT.items():
        log(f"Creating content for {language}...")
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
            link={"internal_link": get_internal_link(pages_created["home"])},
        )
        # Add a licence
        if licences:
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
            "text", max_nb_chars=random.randint(150, 250)  # nosec
        ).evaluate(None, None, {"locale": language})
        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body=text,
        )

        # Once content has been added we must publish again the about page
        pages_created["annex__about"].publish(language)
    # Create a sitemap page
    log("Creating sitemap page...")
    placeholder = pages_created["annex__sitemap"].placeholders.get(slot="maincontent")
    for language in pages_created["annex__sitemap"].get_languages():
        parent_instance = add_plugin(
            language=language, placeholder=placeholder, plugin_type="HTMLSitemapPlugin"
        )
        for name, params in defaults.SITEMAP_PAGE_PARAMS.items():
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


def create_program_list_page(pages_created):
    """
    Create the programs list page and fill it with content.
    """
    placeholder = pages_created["programs"].placeholders.get(slot="maincontent")
    for language in pages_created["programs"].get_languages():
        create_text_plugin(
            pages_created["programs"],
            placeholder,
            nb_paragraphs=random.randint(3, 4),  # nosec
            languages=[language],
            plugin_type="TextPlugin",
        )

        # Once content has been added we must publish again homepage
        pages_created["programs"].publish(language)


def create_programs(
    courses, languages, organizations, pages_created, persons, subjects
):
    """
    Create programs and fill them with content.
    """
    programs = []
    for _i in range(NB_OBJECTS["programs"]):
        program = factories.ProgramFactory.create(
            page_in_navigation=True,
            page_languages=languages,
            page_parent=pages_created["programs"],
            fill_cover=pick_image("cover"),
            fill_excerpt=True,
            fill_body=True,
            fill_categories=[
                *random.sample(subjects, NB_OBJECTS["programs_categories"])
            ],
            fill_organizations=[
                *random.sample(organizations, NB_OBJECTS["programs_organizations"])
            ],
            fill_team=[*random.sample(persons, NB_OBJECTS["programs_persons"])],
            fill_courses=[*random.sample(courses, NB_OBJECTS["programs_courses"])],
            should_publish=True,
        )
        programs.append(program)
    return programs


def create_blog_posts(languages, levels, pages_created, persons, tags):
    """
    Create blog posts and fill them with content.
    """
    blogposts = []
    for _i in range(NB_OBJECTS["blogposts"]):
        post = factories.BlogPostFactory.create(
            page_in_navigation=True,
            page_languages=languages,
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
    return blogposts


def create_courses(
    icons,
    languages,
    levels,
    licences,
    lms_endpoint,
    organizations,
    pages_created,
    persons_for_organization,
    subjects,
    title=None,
    price=None,
    certificate_price=None,
    discount=None,
    discounted_price=None,
):
    """
    Create courses and fill them with content.
    """
    video_sample = random.choice(factories.VIDEO_SAMPLE_LINKS)  # nosec

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

    course_licences = (
        [
            ("course_license_content", random.choice(licences)),  # nosec
            ("course_license_participation", random.choice(licences)),  # nosec
        ]
        if licences
        else []
    )

    course = factories.CourseFactory(
        page_title=title,
        page_in_navigation=True,
        page_languages=languages,
        page_parent=pages_created["courses"],
        fill_licences=course_licences,
        fill_team=random.sample(
            list(eligible_persons),
            min(
                random.randint(1, NB_OBJECTS["course_persons"]),  # nosec
                len(eligible_persons),
            ),
        ),
        fill_teaser=video_sample,
        fill_cover=pick_image("cover")(video_sample.image),
        fill_categories=[
            *random.sample(
                subjects,
                random.randint(1, NB_OBJECTS["course_subjects"]),  # nosec
            ),
            random.choice(levels),  # nosec
        ],
        fill_icons=random.sample(icons, get_number_of_icons()),
        fill_organizations=course_organizations,
        fill_plan=True,
        fill_texts={
            "course_assessment": "CKEditorPlugin",
            "course_description": "CKEditorPlugin",
            "course_introduction": "PlainTextPlugin",
            "course_format": "CKEditorPlugin",
            "course_prerequisites": "CKEditorPlugin",
            "course_skills": "CKEditorPlugin",
        },
    )
    course.create_permissions_for_organization(course_organizations[0])

    # Add extra information
    for language in course.extended_object.get_languages():
        placeholder = course.extended_object.placeholders.get(slot="course_information")
        nb_half_rows = 2 * random.randint(0, 1)  # nosec
        nb_full_rows = random.randint(0, 2)  # nosec
        nb_cards = 4 * random.randint(0, 1)  # nosec

        # Partners
        partner_section = None
        if nb_half_rows or nb_full_rows:
            partner_section = add_plugin(
                language=language,
                placeholder=placeholder,
                plugin_type="SectionPlugin",
                title=defaults.COURSE_CONTENT[language]["partners_title"],
            )
        for _i in range(nb_half_rows):
            glimpse_data = factory.build(
                dict,
                FACTORY_CLASS=GlimpseFactory,
                variant=glimpse_defaults.ROW_HALF,
                image=image_getter(pick_image("logo")()),
            )
            glimpse_data["image"].save()
            add_plugin(
                language=language,
                placeholder=placeholder,
                plugin_type="GlimpsePlugin",
                target=partner_section,
                **glimpse_data,
            )
        for _i in range(nb_full_rows):
            glimpse_data = factory.build(
                dict,
                FACTORY_CLASS=GlimpseFactory,
                variant=glimpse_defaults.ROW_FULL,
                image=image_getter(pick_image("logo")()),
            )
            glimpse_data["image"].save()
            add_plugin(
                language=language,
                placeholder=placeholder,
                plugin_type="GlimpsePlugin",
                target=partner_section,
                **glimpse_data,
            )
        # Sponsors
        sponsor_section = None
        if nb_cards:
            sponsor_section = add_plugin(
                language=language,
                placeholder=placeholder,
                plugin_type="SectionPlugin",
                title=defaults.COURSE_CONTENT[language]["sponsors_title"],
            )
        for _i in range(nb_cards):
            glimpse_data = factory.build(
                dict,
                FACTORY_CLASS=GlimpseFactory,
                variant=glimpse_defaults.CARD_SQUARE,
                image=image_getter(pick_image("logo")()),
            )
            glimpse_data["image"].save()
            add_plugin(
                language=language,
                placeholder=placeholder,
                plugin_type="GlimpsePlugin",
                target=sponsor_section,
                **glimpse_data,
            )

    # Publish the course in all languages
    for language in course.extended_object.get_languages():
        course.extended_object.publish(language)
    return course


def create_persons(languages, organizations, pages_created, subjects):
    """
    Create persons and fill them with content.
    """
    persons = []
    persons_for_organization = defaultdict(list)
    for _i in range(NB_OBJECTS["persons"]):
        # Randomly assign each person to a set of organizations
        person_organizations = random.sample(
            organizations,
            random.randint(1, NB_OBJECTS["person_organizations"]),  # nosec
        )

        person = factories.PersonFactory(
            page_in_navigation=True,
            page_languages=languages,
            page_parent=pages_created["persons"],
            fill_categories=random.sample(
                subjects,
                random.randint(1, NB_OBJECTS["person_subjects"]),  # nosec
            ),
            fill_organizations=person_organizations,
            fill_portrait=pick_image("portrait"),
            fill_bio=True,
            fill_maincontent=True,
            should_publish=True,
        )
        persons.append(person)
        for organization in person_organizations:
            persons_for_organization[organization.id].append(person)
    return persons, persons_for_organization


def create_organizations(languages, pages_created, partnerships):
    """
    Create organizations and fill them with content.
    """
    organizations = []
    for i in range(NB_OBJECTS["organizations"]):
        # Randomly assign each organization to a partnership level category

        organizations.append(
            factories.OrganizationFactory(
                page_in_navigation=True,
                page_languages=languages,
                page_parent=pages_created["organizations"],
                fill_banner=pick_image("banner"),
                fill_categories=(
                    [random.choice(partnerships)] if (i % 2 == 0) else []  # nosec
                ),
                fill_description=True,
                fill_logo=pick_image("logo"),
                should_publish=True,
                with_permissions=True,
            )
        )
    return organizations


def create_all_categories(pages_created, log=lambda x: None):
    """
    Create all categories and return a list of the leaf categories.
    """
    log("  Creating icons...")
    icons = list(
        create_categories(
            **ICONS_INFO,
            fill_banner=pick_image("banner"),
            fill_logo=pick_image("category_logo"),
            page_parent=pages_created["categories"],
        )
    )
    log("  Creating levels...")
    levels = list(
        create_categories(
            **LEVELS_INFO,
            fill_banner=pick_image("banner"),
            fill_logo=pick_image("category_logo"),
            page_parent=pages_created["categories"],
        )
    )
    log("  Creating subjects...")
    subjects = list(
        create_categories(
            **SUBJECTS_INFO,
            fill_banner=pick_image("banner"),
            fill_logo=pick_image("category_logo"),
            page_parent=pages_created["categories"],
        )
    )
    log("  Creating partnerships...")
    partnerships = list(
        create_categories(
            **PARTNERSHIPS_INFO,
            fill_banner=pick_image("banner"),
            fill_logo=pick_image("category_logo"),
            page_parent=pages_created["categories"],
        )
    )
    log("  Creating tags...")
    tags = list(
        create_categories(
            **TAGS_INFO,
            fill_banner=pick_image("banner"),
            fill_logo=pick_image("category_logo"),
            page_parent=pages_created["categories"],
        )
    )
    return icons, levels, partnerships, subjects, tags


def create_licences():
    """
    Create licences and return a list of them.
    """
    licences = (
        factories.LicenceFactory.create_batch(
            NB_OBJECTS["licences"],
            logo__file__from_path=pick_image("licence")(),
        )
        if NB_OBJECTS.get("licences")
        else []
    )
    return licences


def create_footer_links(pages_created):
    """
    Create the footer links in the static placeholder "footer".
    """

    def create_footer_link(pages_created, **link_info):
        """
        Use LinkPlugin to create a link in footer menu with link_info

        Links can be nested into a NestedItemPlugin, in this case link_info contains
        a target key.
        """
        if "internal_link" in link_info["link"]:
            link_info = link_info.copy()
            link_page = pages_created[link_info["link"]["internal_link"]]
            link_info["link"] = {"internal_link": get_internal_link(link_page)}
        add_plugin(plugin_type="LinkPlugin", **link_info)

    footer_static_ph = StaticPlaceholder.objects.get_or_create(code="footer")[0]
    for footer_placeholder in [footer_static_ph.draft, footer_static_ph.public]:
        for language, content in defaults.FOOTER_CONTENT.items():
            for footer_info in content:
                if "items" in footer_info:
                    # Create the first level items for main columns
                    nest_column_plugin = add_plugin(
                        footer_placeholder,
                        plugin_type="NestedItemPlugin",
                        language=language,
                        content=footer_info.get("title", ""),
                    )

                    # Create the second level items for links
                    for item_info in footer_info.get("items", []):
                        create_footer_link(
                            pages_created,
                            language=language,
                            placeholder=footer_placeholder,
                            target=nest_column_plugin,
                            **item_info,
                        )
                else:
                    # Create link at first level
                    create_footer_link(
                        pages_created,
                        language=language,
                        placeholder=footer_placeholder,
                        **footer_info,
                    )


def create_site():
    """
    Create a site with the default domain and name, and return the languages,
    """
    site = Site.objects.get(id=1)
    site.domain = getattr(
        settings, "RICHIE_DEMO_SITE_DOMAIN", defaults.DEFAULT_DEMO_SITE_DOMAIN
    )
    site.name = "Richie demonstration"
    site.save()
    languages = getattr(settings, "LANGUAGES", ())
    languages = [language_code for language_code, _ in languages]
    lms_endpoint = (
        getattr(settings, "RICHIE_LMS_BACKENDS", None)
        or [{"BASE_URL": defaults.DEFAULT_LMS_ENDPOINT}]
    )[0]["BASE_URL"]
    return languages, lms_endpoint, site


@override_settings(RICHIE_KEEP_SEARCH_UPDATED=False)
def create_dev_data(log=lambda x: None):
    """
    Create a simple site tree structure for developpers to work in realistic environment.

    We create multilingual pages, add organizations under the related page and add
    plugins to each page.
    """
    log("Creating demo site...")
    languages, lms_endpoint, site = create_site()

    # Create pages as described in PAGES_INFOS$
    log("Creating pages...")
    pages_created = recursive_page_creation(site, defaults.PAGES_INFO)

    # Create the footer links
    log("Creating footer links...")
    create_footer_links(pages_created)

    # Create some licences
    log("Creating licences...")
    licences = create_licences()

    # Generate each category tree and return a list of the leaf categories
    log("Creating categories...")
    icons, levels, partnerships, subjects, tags = create_all_categories(
        pages_created, log
    )

    # Create organizations under the `Organizations` page
    log(f"Creating {NB_OBJECTS['organizations']} organizations...")
    organizations = create_organizations(languages, pages_created, partnerships)

    # Create persons under the `persons` page
    log(f"Creating {NB_OBJECTS['persons']} persons...")
    persons, persons_for_organization = create_persons(
        languages, organizations, pages_created, subjects
    )

    # Assign each person randomly to an organization so that our course are tagged realistically
    # If organizations and persons are tagged randomly on courses, each organizations will
    # in the end be related to most persons... not what we want.

    # Create courses under the `Course` page with categories and organizations
    # relations
    log(f"Creating {NB_OBJECTS['courses']} courses...")
    courses = []
    course = create_courses(
        icons,
        languages,
        levels,
        licences,
        lms_endpoint,
        organizations,
        pages_created,
        persons_for_organization,
        subjects,
        title="Certificate product",
        price=0,
        certificate_price=100,
    )
    courses.append(course)
    course = create_courses(
        icons,
        languages,
        levels,
        licences,
        lms_endpoint,
        organizations,
        pages_created,
        persons_for_organization,
        subjects,
        title="Certificate product discount",
        price=0,
        certificate_price=100,
        discount="-20 €",
        discounted_price=80,
    )
    courses.append(course)
    course = create_courses(
        icons,
        languages,
        levels,
        licences,
        lms_endpoint,
        organizations,
        pages_created,
        persons_for_organization,
        subjects,
        title="Credential product",
        price=100,
        certificate_price=0,
    )
    courses.append(course)
    course = create_courses(
        icons,
        languages,
        levels,
        licences,
        lms_endpoint,
        organizations,
        pages_created,
        persons_for_organization,
        subjects,
        title="Credential product discount",
        price=100,
        certificate_price=0,
        discount="-20 €",
        discounted_price=80,
    )
    courses.append(course)

    # Create blog posts under the `News` page
    log(f"Creating {NB_OBJECTS['blogposts']} blog posts...")
    blogposts = create_blog_posts(languages, levels, pages_created, persons, tags)

    # Create programs under the `Programs` page
    log(f"Creating {NB_OBJECTS['programs']} programs...")
    programs = create_programs(
        courses, languages, organizations, pages_created, persons, subjects
    )

    # Create some content on the programs list page
    log("Creating content on the programs list page...")
    create_program_list_page(pages_created)

    # Once everything has been created, use some content to create a homepage
    log("Creating content on the homepage...")
    create_homepage(
        blogposts,
        courses,
        licences,
        log,
        organizations,
        pages_created,
        persons,
        programs,
        subjects,
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
        def log(message):
            """Log message"""
            self.stdout.write(self.style.SUCCESS(message))

        if not settings.DEBUG and not options["force"]:
            raise CommandError(
                (
                    "This command is not meant to be used in production environment "
                    "except you know what you are doing, if so use --force parameter"
                )
            )

        create_dev_data(log=log)

        logger.info("done")
