"""Parameters that define how the demo site will be built."""

from django.conf import settings
from django.utils import translation
from django.utils.translation import gettext_lazy as _

from .utils import pick_image

DEFAULT_DEMO_SITE_DOMAIN = "localhost:8070"
DEFAULT_LMS_ENDPOINT = "http://localhost:8073"

NB_OBJECTS = {
    "courses": 75,
    "course_courseruns": 5,
    "course_icons": 3,
    "course_organizations": 3,
    "course_persons": 6,
    "course_subjects": 2,
    "person_organizations": 3,
    "person_subjects": 3,
    "organizations": 24,
    "licences": 5,
    "persons": 50,
    "blogposts": 26,
    "blogpost_levels": 1,
    "blogpost_tags": 1,
    "programs": 6,
    "programs_courses": 4,
    "programs_organizations": 1,
    "programs_categories": 1,
    "programs_persons": 2,
    "home_blogposts": 5,
    "home_courses": 7,
    "home_organizations": 4,
    "home_subjects": 6,
    "home_persons": 4,
    "home_programs": 4,
}
NB_OBJECTS.update(getattr(settings, "RICHIE_DEMO_NB_OBJECTS", {}))

languages = getattr(settings, "LANGUAGES", ())


def translate_message(code, label):
    """Translate a message in a specific language."""

    with translation.override(code):
        new_label = str(_(label))
        return new_label


def set_labels_by_language(label):
    """Set a label for all languages."""

    labels = {}

    for language in languages:
        labels.update({str(language[0]): translate_message(language[0], label)})

    return labels


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
PAGES_INFO.update(getattr(settings, "RICHIE_DEMO_PAGES_INFO", {}))


LEVELS_INFO = {
    "page_title": set_labels_by_language("Level"),
    "children": [
        {"page_title": set_labels_by_language("Beginner")},
        {"page_title": set_labels_by_language("Advanced")},
        {"page_title": set_labels_by_language("Expert")},
    ],
    "page_reverse_id": "levels",
}
LEVELS_INFO.update(getattr(settings, "RICHIE_DEMO_LEVELS_INFO", {}))

PARTNERSHIPS_INFO = {
    "page_title": set_labels_by_language("Partnership"),
    "children": [
        {"page_title": set_labels_by_language("Gold")},
        {"page_title": set_labels_by_language("Silver")},
        {"page_title": set_labels_by_language("Bronze")},
    ],
    "page_reverse_id": "partnerships",
}
PARTNERSHIPS_INFO.update(getattr(settings, "RICHIE_DEMO_PARTNERSHIPS_INFO", {}))

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
TAGS_INFO.update(getattr(settings, "RICHIE_DEMO_TAGS_INFO", {}))

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
                {"page_title": set_labels_by_language("Mathematics and Statistics")},
                {"page_title": set_labels_by_language("Tools for Research")},
                {"page_title": set_labels_by_language("Physics")},
                {"page_title": set_labels_by_language("Cognitive science")},
                {
                    "page_title": set_labels_by_language(
                        "Earth science and science of the Universe"
                    )
                },
                {"page_title": set_labels_by_language("Life science")},
                {"page_title": set_labels_by_language("Engineering science")},
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
                {"page_title": set_labels_by_language("Innovation")},
                {"page_title": set_labels_by_language("Literature")},
                {"page_title": set_labels_by_language("Media")},
                {"page_title": set_labels_by_language("Philosophy")},
                {"page_title": set_labels_by_language("Political science")},
                {"page_title": set_labels_by_language("International relations")},
                {"page_title": set_labels_by_language("Sports")},
            ],
        },
        {"page_title": set_labels_by_language("Law")},
        {"page_title": set_labels_by_language("Economy and Finance")},
        {"page_title": set_labels_by_language("Education and Training")},
        {"page_title": set_labels_by_language("Management")},
        {"page_title": set_labels_by_language("Entrepreneurship")},
        {
            "page_title": set_labels_by_language("Computer science"),
            "children": [
                {"page_title": set_labels_by_language("Digital and Technology")},
                {
                    "page_title": set_labels_by_language(
                        "Telecommunication and Networks"
                    )
                },
                {"page_title": set_labels_by_language("Coding")},
            ],
        },
        {"page_title": set_labels_by_language("Languages")},
        {"page_title": set_labels_by_language("Education and career guidance")},
        {"page_title": set_labels_by_language("Health")},
    ],
    "page_reverse_id": "subjects",
}
SUBJECTS_INFO.update(getattr(settings, "RICHIE_DEMO_SUBJECTS_INFO", {}))

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
ICONS_INFO.update(getattr(settings, "RICHIE_DEMO_ICONS_INFO", {}))

HOMEPAGE_CONTENT = {
    str(code): {
        "banner_title": translate_message(str(code), "Welcome to Richie"),
        "banner_content": (
            f"""
<h1 class="hero-intro__title">{translate_message(str(code), "Welcome")}
<strong>{translate_message(str(code), "to Richie")}</strong></h1>
<p>{translate_message(str(code), "It works! This is the default homepage for the Richie CMS.")}</p>
"""
        ),
        "banner_template": "richie/large_banner/hero-intro.html",
        "button_template_name": "button-caesura",
        "section_template": "richie/section/section.html",
        "blogposts_title": translate_message(str(code), "Last news"),
        "blogposts_button_title": translate_message(str(code), "More news"),
        "courses_title": translate_message(str(code), "Popular courses"),
        "courses_button_title": translate_message(str(code), "More courses"),
        "organizations_title": translate_message(str(code), "Universities"),
        "organizations_button_title": translate_message(str(code), "More universities"),
        "persons_title": translate_message(str(code), "Persons"),
        "persons_button_title": translate_message(str(code), "More persons"),
        "programs_title": translate_message(str(code), "Programs"),
        "programs_button_title": translate_message(str(code), "More programs"),
        "subjects_title": translate_message(str(code), "Subjects"),
        "subjects_button_title": translate_message(str(code), "More subjects"),
    }
    for code, _ in languages
}
HOMEPAGE_CONTENT.update(getattr(settings, "RICHIE_DEMO_HOMEPAGE_CONTENT", {}))

SINGLECOLUMN_CONTENT = {
    str(code): {
        "banner_title": translate_message(str(code), "Single column template sample"),
        "banner_content": translate_message(
            str(code), "It works! This is a single column page."
        ),
        "banner_template": "richie/large_banner/hero-intro.html",
        "button_template_name": "button-caesura",
        "section_sample_title": translate_message(str(code), "A sample section"),
        "section_sample_button_title": translate_message(str(code), "More"),
        "section_sample_template": "richie/section/section.html",
    }
    for code, _ in languages
}
SINGLECOLUMN_CONTENT.update(getattr(settings, "RICHIE_DEMO_SINGLECOLUMN_CONTENT", {}))

FOOTER_CONTENT = {
    str(code): [
        {
            "name": translate_message(str(code), "About"),
            "link": {"internal_link": "annex__about"},
        },
        {
            "name": translate_message(str(code), "Sitemap"),
            "link": {"internal_link": "annex__sitemap"},
        },
        {
            "name": translate_message(str(code), "Style guide"),
            "link": {"external_link": "/styleguide/"},
        },
        {
            "title": translate_message(str(code), "Richie community"),
            "items": [
                {
                    "name": translate_message(str(code), "Website"),
                    "link": {"external_link": "https://richie.education"},
                },
                {
                    "name": "Github",
                    "link": {"external_link": "https://github.com/openfun/richie"},
                },
                {
                    "name": translate_message(str(code), "Site factory"),
                    "link": {
                        "external_link": "https://github.com/openfun/richie-site-factory"
                    },
                },
                {
                    "name": translate_message(str(code), "Example site"),
                    "link": {"external_link": "https://www.fun-campus.fr"},
                },
            ],
        },
    ]
    for code, _ in languages
}
FOOTER_CONTENT.update(getattr(settings, "RICHIE_DEMO_FOOTER_CONTENT", {}))

COURSE_CONTENT = {
    str(code): {
        "partners_title": translate_message(str(code), "Partners"),
        "sponsors_title": translate_message(str(code), "Sponsors"),
    }
    for code, _ in languages
}
COURSE_CONTENT.update(getattr(settings, "RICHIE_DEMO_COURSE_CONTENT", {}))

SITEMAP_PAGE_PARAMS = {
    "blogposts": {"max_depth": 1},
    "courses": {"max_depth": 1},
    "categories": {},
    "organizations": {"max_depth": 1},
    "persons": {"max_depth": 1},
    "programs": {"max_depth": 1},
    "annex": {"include_root_page": False},
}
