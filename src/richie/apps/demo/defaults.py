"""Parameters that define how the demo site will be built."""
from django.conf import settings

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
    "home_blogposts": 5,
    "home_courses": 7,
    "home_organizations": 4,
    "home_subjects": 6,
    "home_persons": 4,
    "home_programs": 4,
}
NB_OBJECTS.update(getattr(settings, "RICHIE_DEMO_NB_OBJECTS", {}))

PAGES_INFO = {
    "home": {
        "title": {"en": "Home", "fr": "Accueil"},
        "in_navigation": False,
        "is_homepage": True,
        "template": "richie/homepage.html",
    },
    "blogposts": {
        "title": {"en": "News", "fr": "Actualités"},
        "in_navigation": True,
        "template": "courses/cms/blogpost_list.html",
    },
    "courses": {
        "title": {"en": "Courses", "fr": "Cours"},
        "in_navigation": True,
        "template": "search/search.html",
    },
    "categories": {
        "title": {"en": "Categories", "fr": "Catégories"},
        "in_navigation": True,
        "template": "courses/cms/category_list.html",
    },
    "organizations": {
        "title": {"en": "Organizations", "fr": "Établissements"},
        "in_navigation": True,
        "template": "courses/cms/organization_list.html",
    },
    "persons": {
        "title": {"en": "Persons", "fr": "Personnes"},
        "in_navigation": True,
        "template": "courses/cms/person_list.html",
    },
    "programs": {
        "title": {"en": "Programs", "fr": "Parcours"},
        "in_navigation": True,
        "template": "courses/cms/program_list.html",
    },
    "annex": {
        "title": {"en": "Annex", "fr": "Annexe"},
        "in_navigation": False,
        "template": "richie/single_column.html",
        "children": {
            "annex__about": {
                "title": {"en": "About", "fr": "A propos"},
                "in_navigation": True,
                "template": "richie/single_column.html",
            },
            "annex__sitemap": {
                "title": {"en": "Sitemap", "fr": "Plan de site"},
                "in_navigation": True,
                "template": "richie/single_column.html",
            },
            "login-error": {
                "title": {"en": "Login error", "fr": "Erreur de connexion"},
                "in_navigation": False,
                "template": "richie/single_column.html",
            },
        },
    },
}
PAGES_INFO.update(getattr(settings, "RICHIE_DEMO_PAGES_INFO", {}))


LEVELS_INFO = {
    "page_title": {"en": "Level", "fr": "Niveau"},
    "children": [
        {"page_title": {"en": "Beginner", "fr": "Débutant"}},
        {"page_title": {"en": "Advanced", "fr": "Avancé"}},
        {"page_title": {"en": "Expert", "fr": "Expert"}},
    ],
    "page_reverse_id": "levels",
}
LEVELS_INFO.update(getattr(settings, "RICHIE_DEMO_LEVELS_INFO", {}))

PARTNERSHIPS_INFO = {
    "page_title": {"en": "Partnership", "fr": "Partenariat"},
    "children": [
        {"page_title": {"en": "Gold", "fr": "Or"}},
        {"page_title": {"en": "Silver", "fr": "Argent"}},
        {"page_title": {"en": "Bronze", "fr": "Bronze"}},
    ],
    "page_reverse_id": "partnerships",
}
PARTNERSHIPS_INFO.update(getattr(settings, "RICHIE_DEMO_PARTNERSHIPS_INFO", {}))

TAGS_INFO = {
    "page_title": {"en": "Tag", "fr": "Etiquette"},
    "children": [
        {"page_title": {"en": "Event", "fr": "Evénement"}},
        {"page_title": {"en": "Feature", "fr": "Fonctionnalité"}},
        {"page_title": {"en": "Around the course", "fr": "Autour du cours"}},
        {"page_title": {"en": "Partner", "fr": "Partenaire"}},
        {"page_title": {"en": "Portrait", "fr": "Portrait"}},
        {"page_title": {"en": "Recruitment", "fr": "Recrutement"}},
    ],
    "page_reverse_id": "tags",
}
TAGS_INFO.update(getattr(settings, "RICHIE_DEMO_TAGS_INFO", {}))

SUBJECTS_INFO = {
    "page_title": {"en": "Subject", "fr": "Sujet"},
    "children": [
        {
            "page_title": {"en": "Science", "fr": "Sciences"},
            "children": [
                {
                    "page_title": {
                        "en": "Agronomy and Agriculture",
                        "fr": "Agronomie et Agriculture",
                    }
                },
                {"page_title": {"en": "Chemistry", "fr": "Chimie"}},
                {
                    "page_title": {
                        "en": "Discovery of the Universe",
                        "fr": "Découverte de l'Univers",
                    }
                },
                {"page_title": {"en": "Environment", "fr": "Environnement"}},
                {
                    "page_title": {
                        "en": "Mathematics and Statistics",
                        "fr": "Mathématiques et Statistiques",
                    }
                },
                {
                    "page_title": {
                        "en": "Tools for Research",
                        "fr": "Outils pour la Recherche",
                    }
                },
                {"page_title": {"en": "Physics", "fr": "Physique"}},
                {
                    "page_title": {
                        "en": "Cognitive science",
                        "fr": "Sciences cognitives",
                    }
                },
                {
                    "page_title": {
                        "en": "Earth science and science of the Universe",
                        "fr": "Sciences de la Terre et de l'Univers",
                    }
                },
                {"page_title": {"en": "Life science", "fr": "Sciences de la vie"}},
                {
                    "page_title": {
                        "en": "Engineering science",
                        "fr": "Sciences pour l'ingénieur",
                    }
                },
            ],
        },
        {
            "page_title": {
                "en": "Human and social sciences",
                "fr": "Sciences humaines et social",
            },
            "children": [
                {"page_title": {"en": "Communication", "fr": "Communication"}},
                {
                    "page_title": {
                        "en": "Creation, Arts and Design",
                        "fr": "Création, Arts et Design",
                    }
                },
                {
                    "page_title": {
                        "en": "Culture and Civilization",
                        "fr": "Cultures et Civilisations",
                    }
                },
                {
                    "page_title": {
                        "en": "Social Issues and Social Policy",
                        "fr": "Enjeux de société",
                    }
                },
                {"page_title": {"en": "Geography", "fr": "Géographie"}},
                {"page_title": {"en": "History", "fr": "Histoire"}},
                {"page_title": {"en": "Innovation", "fr": "Innovation"}},
                {"page_title": {"en": "Literature", "fr": "Lettres"}},
                {"page_title": {"en": "Media", "fr": "Médias"}},
                {"page_title": {"en": "Philosophy", "fr": "Philosophie"}},
                {
                    "page_title": {
                        "en": "Political science",
                        "fr": "Sciences politiques",
                    }
                },
                {
                    "page_title": {
                        "en": "International relations",
                        "fr": "Relations internationales",
                    }
                },
                {"page_title": {"en": "Sports", "fr": "Sport"}},
            ],
        },
        {"page_title": {"en": "Law", "fr": "Droit et juridique"}},
        {"page_title": {"en": "Economy and Finance", "fr": "Economie et Finance"}},
        {
            "page_title": {
                "en": "Education and Training",
                "fr": "Education et formation",
            }
        },
        {"page_title": {"en": "Management", "fr": "Management"}},
        {"page_title": {"en": "Entrepreneurship", "fr": "Entreprenariat"}},
        {
            "page_title": {"en": "Computer science", "fr": "Informatique"},
            "children": [
                {
                    "page_title": {
                        "en": "Digital and Technology",
                        "fr": "Numérique et Technologie",
                    }
                },
                {
                    "page_title": {
                        "en": "Telecommunication and Networks",
                        "fr": "Télécommunications et Réseaux",
                    }
                },
                {"page_title": {"en": "Coding", "fr": "Programmation"}},
            ],
        },
        {"page_title": {"en": "Languages", "fr": "Langues"}},
        {"page_title": {"en": "Education and career guidance", "fr": "Orientation"}},
        {"page_title": {"en": "Health", "fr": "Santé"}},
    ],
    "page_reverse_id": "subjects",
}
SUBJECTS_INFO.update(getattr(settings, "RICHIE_DEMO_SUBJECTS_INFO", {}))

ICONS_INFO = {
    "page_title": {"en": "Icons", "fr": "Icônes"},
    "children": [
        {
            "page_title": {"en": "Academic", "fr": "Diplomant"},
            "color": "#005c08",
            "fill_icon": pick_image("icons")("academic.png"),
        },
        {
            "page_title": {"en": "Accessible", "fr": "Accessible"},
            "color": "#00a1d6",
            "fill_icon": pick_image("icons")("accessible.png"),
        },
        {
            "page_title": {"en": "Closed caption", "fr": "Sous-titres malentendants"},
            "color": "#a11000",
            "fill_icon": pick_image("icons")("cc.png"),
        },
        {
            "page_title": {"en": "Certificate", "fr": "Certifiant"},
            "color": "#ffc400",
            "fill_icon": pick_image("icons")("certificate.png"),
        },
        {
            "page_title": {"en": "Subtitles", "fr": "Sous-titres"},
            "color": "#6d00ba",
            "fill_icon": pick_image("icons")("subtitles.png"),
        },
    ],
    "page_reverse_id": "icons",
}
ICONS_INFO.update(getattr(settings, "RICHIE_DEMO_ICONS_INFO", {}))

HOMEPAGE_CONTENT = {
    "en": {
        "banner_title": "Welcome to Richie",
        "banner_content": (
            """<h1 class="hero-intro__title">Welcome <strong>to Richie</strong></h1>"""
            """<p>It works! This is the default homepage for the Richie CMS.</p>"""
        ),
        "banner_template": "richie/large_banner/hero-intro.html",
        "button_template_name": "button-caesura",
        "section_template": "richie/section/section.html",
        "blogposts_title": "Last news",
        "blogposts_button_title": "More news",
        "courses_title": "Popular courses",
        "courses_button_title": "More courses",
        "organizations_title": "Universities",
        "organizations_button_title": "More universities",
        "persons_title": "Persons",
        "persons_button_title": "More persons",
        "programs_title": "Programs",
        "programs_button_title": "More programs",
        "subjects_title": "Subjects",
        "subjects_button_title": "More subjects",
    },
    "fr": {
        "banner_title": "Bienvenue sur Richie",
        "banner_content": (
            """<h1 class="hero-intro__title">Bienvenue <strong>sur Richie</strong></h1>"""
            """<p>Ça marche ! Ceci est la page d'accueil par défaut du CMS Richie.</p>"""
        ),
        "banner_template": "richie/large_banner/hero-intro.html",
        "button_template_name": "button-caesura",
        "section_template": "richie/section/section.html",
        "blogposts_title": "Actualités récentes",
        "blogposts_button_title": "Plus d'actualités",
        "courses_title": "Cours à la une",
        "courses_button_title": "Plus de cours",
        "organizations_title": "Universités",
        "organizations_button_title": "Plus d'universités",
        "subjects_title": "Thématiques",
        "subjects_button_title": "Plus de thématiques",
        "persons_title": "Personnes",
        "persons_button_title": "Plus de personnes",
        "programs_title": "Parcours",
        "programs_button_title": "Plus de parcours",
    },
}
HOMEPAGE_CONTENT.update(getattr(settings, "RICHIE_DEMO_HOMEPAGE_CONTENT", {}))

SINGLECOLUMN_CONTENT = {
    "en": {
        "banner_title": "Single column template sample",
        "banner_content": "It works! This is a single column page.",
        "banner_template": "richie/large_banner/hero-intro.html",
        "button_template_name": "button-caesura",
        "section_sample_title": "A sample section",
        "section_sample_button_title": "More!",
        "section_sample_template": "richie/section/section.html",
    },
    "fr": {
        "banner_title": "Exemple de template avec une colonne unique",
        "banner_content": "Ça marche ! Ceci est une page d'une colonne.",
        "banner_template": "richie/large_banner/hero-intro.html",
        "button_template_name": "button-caesura",
        "section_sample_title": "Une section d'exemple",
        "section_sample_button_title": "Plus !",
        "section_sample_template": "richie/section/section.html",
    },
}
SINGLECOLUMN_CONTENT.update(getattr(settings, "RICHIE_DEMO_SINGLECOLUMN_CONTENT", {}))

FOOTER_CONTENT = {
    "en": [
        {"name": "About", "internal_link": "annex__about"},
        {"name": "Sitemap", "internal_link": "annex__sitemap"},
        {"name": "Style guide", "external_link": "/styleguide/"},
        {
            "title": "Richie community",
            "items": [
                {"name": "Website", "external_link": "https://richie.education"},
                {
                    "name": "Github",
                    "external_link": "https://github.com/openfun/richie",
                },
                {
                    "name": "Site factory",
                    "external_link": "https://github.com/openfun/richie-site-factory",
                },
                {
                    "name": "Example site",
                    "external_link": "https://www.fun-campus.fr",
                },
            ],
        },
    ],
    "fr": [
        {"name": "A propos", "internal_link": "annex__about"},
        {"name": "Plan du site", "internal_link": "annex__sitemap"},
        {"name": "Style guide", "external_link": "/styleguide/"},
        {
            "title": "Communauté Richie",
            "items": [
                {"name": "Site web", "external_link": "https://richie.education"},
                {
                    "name": "Github",
                    "external_link": "https://github.com/openfun/richie",
                },
                {
                    "name": "Usine à sites",
                    "external_link": "https://github.com/openfun/richie-site-factory",
                },
                {
                    "name": "Site exemple",
                    "external_link": "https://www.fun-campus.fr",
                },
            ],
        },
    ],
}
FOOTER_CONTENT.update(getattr(settings, "RICHIE_DEMO_FOOTER_CONTENT", {}))

COURSE_CONTENT = {
    "en": {"partners_title": "Partners", "sponsors_title": "Sponsors"},
    "fr": {"partners_title": "Partenaires", "sponsors_title": "Sponsors"},
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
