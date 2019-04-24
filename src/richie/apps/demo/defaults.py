"""Parameters that define how the demo site will be built."""
from django.conf import settings

from richie.apps.courses import models

NB_OBJECTS = {
    "courses": 30,
    "course_organizations": 3,
    "course_persons": 6,
    "course_subjects": 2,
    "person_organizations": 3,
    "person_subjects": 3,
    "organizations": 5,
    "licences": 5,
    "persons": 50,
    "blogposts": 20,
    "blogpost_categories": 3,
    "home_blogposts": 4,
    "home_courses": 8,
    "home_organizations": 4,
    "home_subjects": 6,
    "home_persons": 3,
}
NB_OBJECTS.update(getattr(settings, "RICHIE_DEMO_NB_OBJECTS", {}))

PAGES_INFO = {
    "home": {
        "title": {"en": "Home", "fr": "Accueil"},
        "in_navigation": False,
        "kwargs": {"template": "richie/homepage.html"},
    },
    "news": {
        "title": {"en": "News", "fr": "Actualités"},
        "in_navigation": True,
        "kwargs": {
            "reverse_id": models.BlogPost.ROOT_REVERSE_ID,
            "template": "courses/cms/blogpost_list.html",
        },
    },
    "courses": {
        "title": {"en": "Courses", "fr": "Cours"},
        "in_navigation": True,
        "kwargs": {
            "reverse_id": models.Course.ROOT_REVERSE_ID,
            "template": "search/search.html",
        },
    },
    "categories": {
        "title": {"en": "Categories", "fr": "Catégories"},
        "in_navigation": True,
        "kwargs": {
            "reverse_id": models.Category.ROOT_REVERSE_ID,
            "template": "courses/cms/category_list.html",
        },
    },
    "organizations": {
        "title": {"en": "Organizations", "fr": "Etablissements"},
        "in_navigation": True,
        "kwargs": {
            "reverse_id": models.Organization.ROOT_REVERSE_ID,
            "template": "courses/cms/organization_list.html",
        },
    },
    "persons": {
        "title": {"en": "Persons", "fr": "Personnes"},
        "in_navigation": True,
        "kwargs": {
            "reverse_id": models.Person.ROOT_REVERSE_ID,
            "template": "courses/cms/person_list.html",
        },
    },
    "dashboard": {
        "title": {"en": "Dashboard", "fr": "Tableau de bord"},
        "in_navigation": False,
        "cms": False,
        "kwargs": {"template": "richie/single_column.html"},
    },
    "annex": {
        "title": {"en": "Annex", "fr": "Annexe"},
        "in_navigation": False,
        "kwargs": {"template": "richie/single_column.html", "reverse_id": "annex"},
        "children": {
            "annex__about": {
                "title": {"en": "About", "fr": "A propos"},
                "in_navigation": True,
                "kwargs": {"template": "richie/single_column.html"},
            }
        },
    },
}
PAGES_INFO.update(getattr(settings, "RICHIE_DEMO_PAGES_INFO", {}))

LEVELS_INFO = {
    "title": {"en": "Level", "fr": "Niveau"},
    "children": [
        {"title": {"en": "Beginner", "fr": "Débutant"}},
        {"title": {"en": "Advanced", "fr": "Avancé"}},
        {"title": {"en": "Expert", "fr": "Expert"}},
    ],
}
LEVELS_INFO.update(getattr(settings, "RICHIE_DEMO_LEVELS_INFO", {}))

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
SUBJECTS_INFO.update(getattr(settings, "RICHIE_DEMO_SUBJECTS_INFO", {}))

HOMEPAGE_CONTENT = {
    "en": {
        "banner_title": "Welcome to Richie",
        "banner_content": "It works! This is the default homepage for the Richie CMS.",
        "banner_template": "richie/large_banner/hero-intro.html",
        "button_template_name": "button-caesura",
        "section_template": "richie/section/highlighted_items.html",
        "blogposts_title": "Last news",
        "blogposts_button_title": "More news",
        "courses_title": "Popular courses",
        "courses_button_title": "More courses",
        "organizations_title": "Universities",
        "organizations_button_title": "More universities",
        "persons_title": "Persons",
        "persons_button_title": "More persons",
        "subjects_title": "Subjects",
        "subjects_button_title": "More subjects",
    },
    "fr": {
        "banner_title": "Bienvenue sur Richie",
        "banner_content": "Ça marche ! Ceci est la page d'accueil par défaut du CMS Richie.",
        "banner_template": "richie/large_banner/hero-intro.html",
        "button_template_name": "button-caesura",
        "section_template": "richie/section/highlighted_items.html",
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
        "section_sample_template": "richie/section/highlighted_items.html",
    },
    "fr": {
        "banner_title": "Exemple de template avec une colonne unique",
        "banner_content": "Ça marche ! Ceci est une page d'une colonne.",
        "banner_template": "richie/large_banner/hero-intro.html",
        "button_template_name": "button-caesura",
        "section_sample_title": "Une section d'exemple",
        "section_sample_button_title": "Plus !",
        "section_sample_template": "richie/section/highlighted_items.html",
    },
}
SINGLECOLUMN_CONTENT.update(getattr(settings, "RICHIE_DEMO_SINGLECOLUMN_CONTENT", {}))
