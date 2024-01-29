"""
Settings specific to the courses application.
"""

from django.conf import settings
from django.utils.translation import gettext_lazy as _

ADMIN = "ADMIN"

ROLE_CHOICES = ((ADMIN, _("Admin")),)

COURSE_ADMIN_ROLE = {
    "django_permissions": [
        # Objects
        "cms.add_page",
        "cms.change_page",
        "cms.add_title",
        "cms.change_title",
        "courses.add_courserun",
        "courses.change_courserun",
        "courses.add_person",
        "courses.change_person",
        "cms.use_structure",
        # Filer
        "filer.add_file",
        "filer.change_file",
        "filer.view_file",
        "filer.add_image",
        "filer.change_image",
        "filer.view_image",
        "filer.can_use_directory_listing",
        "filer.change_folder",
        "filer.view_folder",
        # Plugins
        "djangocms_link.add_link",
        "djangocms_link.change_link",
        "djangocms_link.delete_link",
        "djangocms_link.view_link",
        "djangocms_picture.add_picture",
        "djangocms_picture.change_picture",
        "djangocms_picture.delete_picture",
        "djangocms_picture.view_picture",
        "djangocms_text_ckeditor.add_text",
        "djangocms_text_ckeditor.change_text",
        "djangocms_text_ckeditor.delete_text",
        "djangocms_text_ckeditor.view_text",
        "djangocms_video.add_videoplayer",
        "djangocms_video.change_videoplayer",
        "djangocms_video.delete_videoplayer",
        "djangocms_video.view_videoplayer",
        "djangocms_video.add_videosource",
        "djangocms_video.change_videosource",
        "djangocms_video.delete_videosource",
        "djangocms_video.view_videosource",
        "djangocms_video.add_videotrack",
        "djangocms_video.change_videotrack",
        "djangocms_video.delete_videotrack",
        "djangocms_video.view_videotrack",
        "plain_text.add_plaintext",
        "plain_text.change_plaintext",
        "plain_text.delete_plaintext",
        "plain_text.view_plaintext",
        "section.add_section",
        "section.change_section",
        "section.delete_section",
        "section.view_section",
        "simple_text_ckeditor.add_simpletext",
        "simple_text_ckeditor.change_simpletext",
        "simple_text_ckeditor.delete_simpletext",
        "simple_text_ckeditor.view_simpletext",
        "courses.add_organizationpluginmodel",
        "courses.change_organizationpluginmodel",
        "courses.delete_organizationpluginmodel",
        "courses.view_organizationpluginmodel",
        "courses.add_personpluginmodel",
        "courses.change_personpluginmodel",
        "courses.delete_personpluginmodel",
        "courses.view_personpluginmodel",
        "courses.add_categorypluginmodel",
        "courses.change_categorypluginmodel",
        "courses.delete_categorypluginmodel",
        "courses.view_categorypluginmodel",
        "courses.add_licencepluginmodel",
        "courses.change_licencepluginmodel",
        "courses.delete_licencepluginmodel",
        "courses.view_licencepluginmodel",
        "courses.view_category",
        "courses.view_person",
        "glimpse.add_glimpse",
        "glimpse.change_glimpse",
        "glimpse.delete_glimpse",
        "glimpse.view_glimpse",
        "lti_consumer.add_lticonsumer",
        "lti_consumer.change_lticonsumer",
        "lti_consumer.delete_lticonsumer",
        "lti_consumer.view_lticonsumer",
        "nesteditem.add_nesteditem",
        "nesteditem.change_nesteditem",
        "nesteditem.delete_nesteditem",
        "nesteditem.view_nesteditem",
    ],
    "course_page_permissions": {
        "can_change": True,
        "can_add": True,
        "can_delete": False,
        "can_change_advanced_settings": False,
        "can_publish": False,
        "can_change_permissions": False,
        "can_move_page": True,
        "can_view": False,  # beware: can_view = True makes it a view restriction...
        "grant_on": 5,  # page and descendants
    },
    "course_folder_permissions": {
        "can_read": True,
        "can_edit": False,
        "can_add_children": True,
        "type": 2,  # folder and children
    },
}
COURSE_ADMIN_ROLE.update(getattr(settings, "RICHIE_COURSE_ADMIN_ROLE", {}))

ORGANIZATION_ADMIN_ROLE = {
    "django_permissions": [
        # Objects
        "cms.add_page",
        "cms.change_page",
        "cms.add_title",
        "cms.change_title",
        "courses.add_course",
        "courses.change_course",
        "courses.add_courserun",
        "courses.change_courserun",
        "courses.add_person",
        "courses.change_person",
        "cms.use_structure",
        # Filer
        "filer.add_file",
        "filer.change_file",
        "filer.view_file",
        "filer.add_image",
        "filer.change_image",
        "filer.view_image",
        "filer.can_use_directory_listing",
        "filer.change_folder",
        "filer.view_folder",
        # Plugins
        "djangocms_link.add_link",
        "djangocms_link.change_link",
        "djangocms_link.delete_link",
        "djangocms_link.view_link",
        "djangocms_picture.add_picture",
        "djangocms_picture.change_picture",
        "djangocms_picture.delete_picture",
        "djangocms_picture.view_picture",
        "djangocms_text_ckeditor.add_text",
        "djangocms_text_ckeditor.change_text",
        "djangocms_text_ckeditor.delete_text",
        "djangocms_text_ckeditor.view_text",
        "djangocms_video.add_videoplayer",
        "djangocms_video.change_videoplayer",
        "djangocms_video.delete_videoplayer",
        "djangocms_video.view_videoplayer",
        "djangocms_video.add_videosource",
        "djangocms_video.change_videosource",
        "djangocms_video.delete_videosource",
        "djangocms_video.view_videosource",
        "djangocms_video.add_videotrack",
        "djangocms_video.change_videotrack",
        "djangocms_video.delete_videotrack",
        "djangocms_video.view_videotrack",
        "plain_text.add_plaintext",
        "plain_text.change_plaintext",
        "plain_text.delete_plaintext",
        "plain_text.view_plaintext",
        "section.add_section",
        "section.change_section",
        "section.delete_section",
        "section.view_section",
        "simple_text_ckeditor.add_simpletext",
        "simple_text_ckeditor.change_simpletext",
        "simple_text_ckeditor.delete_simpletext",
        "simple_text_ckeditor.view_simpletext",
        "courses.add_organizationpluginmodel",
        "courses.change_organizationpluginmodel",
        "courses.delete_organizationpluginmodel",
        "courses.view_organizationpluginmodel",
        "courses.add_personpluginmodel",
        "courses.change_personpluginmodel",
        "courses.delete_personpluginmodel",
        "courses.view_personpluginmodel",
        "courses.add_categorypluginmodel",
        "courses.change_categorypluginmodel",
        "courses.delete_categorypluginmodel",
        "courses.view_categorypluginmodel",
        "courses.add_licencepluginmodel",
        "courses.change_licencepluginmodel",
        "courses.delete_licencepluginmodel",
        "courses.view_licencepluginmodel",
        "courses.view_category",
        "courses.view_person",
        "glimpse.add_glimpse",
        "glimpse.change_glimpse",
        "glimpse.delete_glimpse",
        "glimpse.view_glimpse",
        "lti_consumer.add_lticonsumer",
        "lti_consumer.change_lticonsumer",
        "lti_consumer.delete_lticonsumer",
        "lti_consumer.view_lticonsumer",
        "nesteditem.add_nesteditem",
        "nesteditem.change_nesteditem",
        "nesteditem.delete_nesteditem",
        "nesteditem.view_nesteditem",
    ],
    "organization_page_permissions": {
        "can_change": True,
        "can_add": True,
        "can_delete": False,
        "can_change_advanced_settings": False,
        "can_publish": False,
        "can_change_permissions": False,
        "can_move_page": False,
        "can_view": False,  # beware: can_view = True makes it a view restriction...
        "grant_on": 1,  # just the page
    },
    "organization_folder_permissions": {
        "can_read": True,
        "can_edit": False,
        "can_add_children": True,
        "type": 2,  # folder and children
    },
    "courses_page_permissions": {
        "can_change": True,
        "can_add": True,
        "can_delete": False,
        "can_change_advanced_settings": False,
        "can_publish": False,
        "can_change_permissions": False,
        "can_move_page": True,
        "can_view": False,  # beware: can_view = True makes it a view restriction...
        "grant_on": 5,  # page and descendants
    },
    "courses_folder_permissions": {
        "can_read": True,
        "can_edit": False,
        "can_add_children": True,
        "type": 2,  # folder and children
    },
}
ORGANIZATION_ADMIN_ROLE.update(getattr(settings, "RICHIE_ORGANIZATION_ADMIN_ROLE", {}))

PAGE_EXTENSION_TOOLBAR_ITEM_POSITION = getattr(
    settings, "RICHIE_PAGE_EXTENSION_TOOLBAR_ITEM_POSITION", 4
)

# Glimpses

BLOGPOST_GLIMPSE_VARIANT_CHOICES = getattr(
    settings,
    "RICHIE_BLOGPOST_GLIMPSE_VARIANT_CHOICES",
    [
        (None, _("Inherit")),
        ("glimpse", _("Default")),
        ("mini", _("Mini")),
        ("favorite", _("Favorite")),
    ],
)
CATEGORY_GLIMPSE_VARIANT_CHOICES = getattr(
    settings,
    "RICHIE_CATEGORY_GLIMPSE_VARIANT_CHOICES",
    [
        (None, _("Inherit")),
        ("glimpse", _("Default")),
        ("badge", _("Badge")),
        ("tag", _("Tag")),
    ],
)
COURSE_GLIMPSE_VARIANT_CHOICES = getattr(
    settings,
    "RICHIE_COURSE_GLIMPSE_VARIANT_CHOICES",
    [
        (None, _("Inherit")),
        ("glimpse", _("Default")),
        ("glimpse", _("Small")),
        ("glimpse__large", _("Large")),
    ],
)

ORGANIZATION_GLIMPSE_VARIANT_CHOICES = getattr(
    settings,
    "RICHIE_ORGANIZATION_GLIMPSE_VARIANT_CHOICES",
    [
        (None, _("Inherit")),
        ("glimpse", _("Default")),
        ("card", _("Card")),
        ("row", _("Row")),
    ],
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
COURSES_PAGE = {"reverse_id": "courses", "template": "courses/cms/course_detail.html"}
ORGANIZATIONS_PAGE = {
    "reverse_id": "organizations",
    "template": "courses/cms/organization_detail.html",
}
PERSONS_PAGE = {"reverse_id": "persons", "template": "courses/cms/person_detail.html"}
PROGRAMS_PAGE = {
    "reverse_id": "programs",
    "template": "courses/cms/program_detail.html",
}

PAGES_INFO = {
    "home": {
        "title": "Home",
        "in_navigation": False,
        "is_homepage": True,
        "template": "richie/homepage.html",
    },
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
    PROGRAMS_PAGE["reverse_id"]: {
        "title": "Programs",
        "in_navigation": True,
        "template": "courses/cms/program_list.html",
    },
}
PAGES_INFO.update(getattr(settings, "PAGES_INFO", {}))

ROOT_REVERSE_IDS = PAGES_INFO.keys()

# Fields effort and duration
MINUTE, HOUR, DAY, WEEK, MONTH = "minute", "hour", "day", "week", "month"
DEFAULT_TIME_UNIT = HOUR
DEFAULT_EFFORT_UNIT = HOUR
DEFAULT_REFERENCE_UNIT = MONTH

TIME_UNITS = {
    MINUTE: (_("minute"), _("minutes")),
    HOUR: (_("hour"), _("hours")),
    DAY: (_("day"), _("days")),
    WEEK: (_("week"), _("weeks")),
    MONTH: (_("month"), _("months")),
}

EFFORT_UNITS = {
    MINUTE: TIME_UNITS[MINUTE],
    HOUR: TIME_UNITS[HOUR],
}

# Maximum number of archived course runs displayed by default on course detail page.
# The additional runs can be viewed by clicking on `View more` link.
RICHIE_MAX_ARCHIVED_COURSE_RUNS = 10
