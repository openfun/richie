"""
Settings specific to the courses application.
"""
from django.conf import settings
from django.utils.translation import ugettext_lazy as _

ADMIN = "ADMIN"

ROLE_CHOICES = ((ADMIN, _("Admin")),)

ORGANIZATION_ADMIN_ROLE = {
    "django_permissions": [],
    "organization_page_permissions": {
        "can_change": True,
        "can_add": True,
        "can_delete": False,
        "can_change_advanced_settings": False,
        "can_publish": False,
        "can_change_permissions": True,
        "can_move_page": False,
        "can_view": True,
        "grant_on": 1,  # just the page
    },
    "courses_page_permissions": {
        "can_change": True,
        "can_add": True,
        "can_delete": False,
        "can_change_advanced_settings": False,
        "can_publish": False,
        "can_change_permissions": True,
        "can_move_page": True,
        "can_view": True,
        "grant_on": 5,  # page and descendants
    },
}
ORGANIZATION_ADMIN_ROLE.update(getattr(settings, "RICHIE_ORGANIZATION_ADMIN_ROLE", {}))

PAGE_EXTENSION_TOOLBAR_ITEM_POSITION = getattr(
    settings, "RICHIE_PAGE_EXTENSION_TOOLBAR_ITEM_POSITION", 4
)

# For each type of page we define:
#   - the `reverse_id` of the page under which pages should be created via the wizard,
#   - the template to be used when creating a new page of this type,
BLOGPOSTS_PAGE = {
    "reverse_id": "blogposts",
    "template": "courses/cms/blogpost_detail.html",
}
CATEGORIES_PAGE = {
    "reverse_id": "categories",
    "template": "courses/cms/category_detail.html",
}
COURSERUNS_PAGE = {"template": "courses/cms/course_run_detail.html"}
COURSES_PAGE = {"reverse_id": "courses", "template": "courses/cms/course_detail.html"}
ORGANIZATIONS_PAGE = {
    "reverse_id": "organizations",
    "template": "courses/cms/organization_detail.html",
}
PERSONS_PAGE = {"reverse_id": "persons", "template": "courses/cms/person_detail.html"}

PAGES_INFO = {
    BLOGPOSTS_PAGE["reverse_id"]: {
        "title": "News",
        "in_navigation": True,
        "template": "courses/cms/blogpost_list.html",
    },
    CATEGORIES_PAGE["reverse_id"]: {
        "title": "Categories",
        "in_navigation": True,
        "template": "courses/cms/category_list.html",
    },
    COURSES_PAGE["reverse_id"]: {
        "title": "Courses",
        "in_navigation": True,
        "template": "search/search.html",
    },
    ORGANIZATIONS_PAGE["reverse_id"]: {
        "title": "Organizations",
        "in_navigation": True,
        "template": "courses/cms/organization_list.html",
    },
    PERSONS_PAGE["reverse_id"]: {
        "title": "Persons",
        "in_navigation": True,
        "template": "courses/cms/person_list.html",
    },
}
PAGES_INFO.update(getattr(settings, "PAGES_INFO", {}))

ROOT_REVERSE_IDS = PAGES_INFO.keys()
