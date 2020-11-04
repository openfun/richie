"""
Default settings for the Richie courses app.

If you use Django Configuration for your settings, you can use our mixin to import these
default settings:
    ```
    from configurations import Configuration
    from richie.apps.courses.settings.mixins import RichieCoursesConfigurationMixin

    class MyConfiguration(RichieCoursesConfigurationMixin, Configuration):
        ...
    ```

Otherwise, you can just use the usual Django pattern in your settings.py file:
    ```
    from richie.apps.courses.settings import *
    ```
"""
from django.utils.translation import gettext_lazy as _

# Associated LMS backends
LMS_BACKENDS = []

# Easy Thumbnails
THUMBNAIL_PROCESSORS = (
    "easy_thumbnails.processors.colorspace",
    "easy_thumbnails.processors.autocrop",
    "filer.thumbnail_processors.scale_and_crop_with_subject_location",
    "easy_thumbnails.processors.filters",
    "easy_thumbnails.processors.background",
)

# Django CMS
CMS_TEMPLATES = (
    ("courses/cms/course_detail.html", _("Course page")),
    ("courses/cms/course_run_detail.html", _("Course run page")),
    ("courses/cms/organization_list.html", _("Organization list")),
    ("courses/cms/organization_detail.html", _("Organization page")),
    ("courses/cms/category_list.html", _("Category list")),
    ("courses/cms/category_detail.html", _("Category page")),
    ("courses/cms/blogpost_list.html", _("Blog post list")),
    ("courses/cms/blogpost_detail.html", _("Blog post page")),
    ("courses/cms/person_detail.html", _("Person page")),
    ("courses/cms/person_list.html", _("Person list")),
    ("courses/cms/program_detail.html", _("Program page")),
    ("courses/cms/program_list.html", _("Program list")),
    ("search/search.html", _("Search")),
    ("richie/child_pages_list.html", _("List of child pages")),
    ("richie/homepage.html", _("Homepage")),
    ("richie/single_column.html", _("Single column")),
)

CMS_PLACEHOLDER_CONF = {
    # -- Static Placeholders
    # Footer
    "footer": {
        "name": _("Footer"),
        "plugins": ["NestedItemPlugin", "LinkPlugin"],
        "NestedItemPlugin": ["LinkPlugin"],
    },
    "static_blogpost_headline": {
        "name": _("Static headline"),
        "plugins": ["SectionPlugin", "CKEditorPlugin"],
        "child_classes": {"SectionPlugin": ["CKEditorPlugin"]},
    },
    # -- Page Placeholders
    # Homepage
    "richie/homepage.html maincontent": {
        "name": _("Main content"),
        "plugins": ["LargeBannerPlugin", "SectionPlugin"],
        "child_classes": {
            "SectionPlugin": [
                "BlogPostPlugin",
                "CategoryPlugin",
                "CoursePlugin",
                "GlimpsePlugin",
                "LinkPlugin",
                "OrganizationPlugin",
                "OrganizationsByCategoryPlugin",
                "PersonPlugin",
                "CKEditorPlugin",
                "SectionPlugin",
                "NestedItemPlugin",
            ],
            "NestedItemPlugin": ["CategoryPlugin"],
        },
    },
    # Single column page
    "richie/single_column.html maincontent": {
        "name": _("Main content"),
        "excluded_plugins": ["CKEditorPlugin", "GoogleMapPlugin"],
        "parent_classes": {
            "BlogPostPlugin": ["SectionPlugin"],
            "CategoryPlugin": ["SectionPlugin"],
            "CoursePlugin": ["SectionPlugin"],
            "GlimpsePlugin": ["SectionPlugin"],
            "OrganizationPlugin": ["SectionPlugin"],
            "OrganizationsByCategoryPlugin": ["SectionPlugin"],
            "PersonPlugin": ["SectionPlugin"],
        },
        "child_classes": {
            "SectionPlugin": [
                "BlogPostPlugin",
                "CategoryPlugin",
                "CoursePlugin",
                "GlimpsePlugin",
                "LinkPlugin",
                "OrganizationPlugin",
                "OrganizationsByCategoryPlugin",
                "PersonPlugin",
                "NestedItemPlugin",
            ],
            "NestedItemPlugin": ["NestedItemPlugin", "LinkPlugin"],
        },
    },
    # Course detail
    "courses/cms/course_detail.html course_cover": {
        "name": _("Cover"),
        "plugins": ["SimplePicturePlugin"],
        "limits": {"SimplePicturePlugin": 1},
    },
    "courses/cms/course_detail.html course_introduction": {
        "name": _("Catch phrase"),
        "plugins": ["PlainTextPlugin"],
        "limits": {"PlainTextPlugin": 1},
    },
    "courses/cms/course_detail.html course_teaser": {
        "name": _("Teaser"),
        "plugins": ["VideoPlayerPlugin", "SimplePicturePlugin"],
        "limits": {"VideoPlayerPlugin": 1, "SimplePicturePlugin": 1},
    },
    "courses/cms/course_detail.html course_description": {
        "name": _("About the course"),
        "plugins": ["CKEditorPlugin"],
        "limits": {"CKEditorPlugin": 1},
    },
    "courses/cms/course_detail.html course_skills": {
        "name": _("What you will learn"),
        "plugins": ["CKEditorPlugin"],
    },
    "courses/cms/course_detail.html course_format": {
        "name": _("Format"),
        "plugins": ["CKEditorPlugin"],
    },
    "courses/cms/course_detail.html course_prerequisites": {
        "name": _("Prerequisites"),
        "plugins": ["CKEditorPlugin"],
    },
    "courses/cms/course_detail.html course_team": {
        "name": _("Team"),
        "plugins": ["PersonPlugin"],
    },
    "courses/cms/course_detail.html course_plan": {
        "name": _("Plan"),
        "plugins": ["NestedItemPlugin"],
        "child_classes": {"NestedItemPlugin": ["NestedItemPlugin"]},
    },
    "courses/cms/course_detail.html course_information": {
        "name": _("Complementary information"),
        "plugins": ["SectionPlugin"],
        "parent_classes": {
            "CKEditorPlugin": ["SectionPlugin"],
            "SimplePicturePlugin": ["SectionPlugin"],
            "GlimpsePlugin": ["SectionPlugin"],
        },
        "child_classes": {
            "SectionPlugin": ["CKEditorPlugin", "SimplePicturePlugin", "GlimpsePlugin"]
        },
    },
    "courses/cms/course_detail.html course_license_content": {
        "name": _("License for the course content"),
        "plugins": ["LicencePlugin"],
        "limits": {"LicencePlugin": 1},
    },
    "courses/cms/course_detail.html course_license_participation": {
        "name": _("License for the content created by course participants"),
        "plugins": ["LicencePlugin"],
        "limits": {"LicencePlugin": 1},
    },
    "courses/cms/course_detail.html course_categories": {
        "name": _("Categories"),
        "plugins": ["CategoryPlugin"],
    },
    "courses/cms/course_detail.html course_icons": {
        "name": _("Icon"),
        "plugins": ["CategoryPlugin"],
        "limits": {"CategoryPlugin": 1},
    },
    "courses/cms/course_detail.html course_organizations": {
        "name": _("Organizations"),
        "plugins": ["OrganizationPlugin"],
    },
    "courses/cms/course_detail.html course_assessment": {
        "name": _("Assessment and Certification"),
        "plugins": ["CKEditorPlugin"],
    },
    # Organization detail
    "courses/cms/organization_detail.html banner": {
        "name": _("Banner"),
        "plugins": ["SimplePicturePlugin"],
        "limits": {"SimplePicturePlugin": 1},
    },
    "courses/cms/organization_detail.html logo": {
        "name": _("Logo"),
        "plugins": ["SimplePicturePlugin"],
        "limits": {"SimplePicturePlugin": 1},
    },
    "courses/cms/organization_detail.html categories": {
        "name": _("Categories"),
        "plugins": ["CategoryPlugin"],
    },
    "courses/cms/organization_detail.html description": {
        "name": _("Description"),
        "plugins": ["CKEditorPlugin"],
        "limits": {"CKEditorPlugin": 1},
    },
    # Category detail
    "courses/cms/category_detail.html banner": {
        "name": _("Banner"),
        "plugins": ["SimplePicturePlugin"],
        "limits": {"SimplePicturePlugin": 1},
    },
    "courses/cms/category_detail.html logo": {
        "name": _("Logo"),
        "plugins": ["SimplePicturePlugin"],
        "limits": {"SimplePicturePlugin": 1},
    },
    "courses/cms/category_detail.html icon": {
        "name": _("Icon"),
        "plugins": ["SimplePicturePlugin"],
        "limits": {"SimplePicturePlugin": 1},
    },
    "courses/cms/category_detail.html description": {
        "name": _("Description"),
        "plugins": ["CKEditorPlugin"],
        "limits": {"CKEditorPlugin": 1},
    },
    # Person detail
    "courses/cms/person_detail.html categories": {
        "name": _("Categories"),
        "plugins": ["CategoryPlugin"],
    },
    "courses/cms/person_detail.html portrait": {
        "name": _("Portrait"),
        "plugins": ["SimplePicturePlugin"],
        "limits": {"SimplePicturePlugin": 1},
    },
    "courses/cms/person_detail.html bio": {
        "name": _("Bio"),
        "plugins": ["PlainTextPlugin"],
        "limits": {"PlainTextPlugin": 1},
    },
    "courses/cms/person_detail.html maincontent": {
        "name": _("Main Content"),
        "plugins": ["CKEditorPlugin"],
        "limits": {"CKEditorPlugin": 1},
    },
    "courses/cms/person_detail.html organizations": {
        "name": _("Organizations"),
        "plugins": ["OrganizationPlugin"],
    },
    # Blog page detail
    "courses/cms/blogpost_detail.html author": {
        "name": _("Author"),
        "plugins": ["PersonPlugin"],
        "limits": {"PersonPlugin": 1},
    },
    "courses/cms/blogpost_detail.html categories": {
        "name": _("Categories"),
        "plugins": ["CategoryPlugin"],
    },
    "courses/cms/blogpost_detail.html cover": {
        "name": _("Cover"),
        "plugins": ["SimplePicturePlugin"],
        "limits": {"SimplePicturePlugin": 1},
    },
    "courses/cms/blogpost_detail.html excerpt": {
        "name": _("Excerpt"),
        "plugins": ["PlainTextPlugin"],
        "limits": {"PlainTextPlugin": 1},
    },
    "courses/cms/blogpost_detail.html body": {
        "name": _("Body"),
        "excluded_plugins": ["CKEditorPlugin", "GoogleMapPlugin"],
    },
    "courses/cms/blogpost_detail.html headline": {
        "name": _("Headline"),
        "plugins": ["SectionPlugin", "CKEditorPlugin"],
        "child_classes": {"SectionPlugin": ["CKEditorPlugin"]},
    },
    # Program page detail
    "courses/cms/program_detail.html program_cover": {
        "name": _("Cover"),
        "plugins": ["SimplePicturePlugin"],
        "limits": {"SimplePicturePlugin": 1},
    },
    "courses/cms/program_detail.html program_excerpt": {
        "name": _("Excerpt"),
        "plugins": ["PlainTextPlugin"],
        "limits": {"PlainTextPlugin": 1},
    },
    "courses/cms/program_detail.html program_body": {
        "name": _("Body"),
        "excluded_plugins": ["CKEditorPlugin", "GoogleMapPlugin"],
    },
    "courses/cms/program_detail.html program_courses": {
        "name": _("Courses"),
        "plugins": ["CoursePlugin"],
    },
    "courses/cms/program_list.html maincontent": {
        "name": _("Main content"),
        "plugins": ["SectionPlugin"],
        "child_classes": {
            "SectionPlugin": [
                "BlogPostPlugin",
                "CategoryPlugin",
                "CoursePlugin",
                "GlimpsePlugin",
                "LinkPlugin",
                "OrganizationPlugin",
                "OrganizationsByCategoryPlugin",
                "PersonPlugin",
                "CKEditorPlugin",
                "SectionPlugin",
                "NestedItemPlugin",
            ],
            "NestedItemPlugin": ["CategoryPlugin"],
        },
    },
}

# Main CKEditor configuration
CKEDITOR_SETTINGS = {
    "language": "{{ language }}",
    "skin": "moono-lisa",
    "toolbarCanCollapse": False,
    "contentsCss": "/static/richie/css/ckeditor.css",
    # Enabled showblocks as default behavior
    "startupOutlineBlocks": True,
    # Enable some plugins
    # 'extraPlugins': 'codemirror',
    # Disable element filter to enable full HTML5, also this will let
    # append any code, even bad syntax and malicious code, so be careful
    "removePlugins": "stylesheetparser",
    "allowedContent": True,
    # Image plugin options
    "image_prefillDimensions": False,
    # Justify text using shortand class names
    "justifyClasses": ["text-left", "text-center", "text-right"],
    # Default toolbar configurations for djangocms_text_ckeditor
    "toolbar": "CMS",
    "toolbar_CMS": [
        ["Undo", "Redo"],
        ["cmsplugins", "-", "ShowBlocks"],
        ["Format", "Styles"],
        ["RemoveFormat"],
        ["Maximize"],
        "/",
        ["Bold", "Italic", "Underline", "-", "Subscript", "Superscript"],
        ["JustifyLeft", "JustifyCenter", "JustifyRight"],
        ["Link", "Unlink"],
        ["NumberedList", "BulletedList", "-", "HorizontalRule"],
        ["Source"],
    ],
}
# Share the same configuration for djangocms_text_ckeditor field and derived
# CKEditor widgets/fields
CKEDITOR_SETTINGS["toolbar_HTMLField"] = CKEDITOR_SETTINGS["toolbar_CMS"]

# CKEditor configuration for basic formatting
CKEDITOR_BASIC_CONFIGURATION = {
    "language": "{{ language }}",
    "skin": "moono-lisa",
    "toolbarCanCollapse": False,
    "contentsCss": "/static/css/ckeditor.css",
    # Only enable following tag definitions
    "allowedContent": ["p", "b", "i", "a[href]"],
    # Enabled showblocks as default behavior
    "startupOutlineBlocks": True,
    # Default toolbar configurations for djangocms_text_ckeditor
    "toolbar": "HTMLField",
    "toolbar_HTMLField": [["Undo", "Redo"], ["Bold", "Italic"], ["Link", "Unlink"]],
}

# CKEditor configuration for formatting limited to:
# paragraph, bold, italic and numbered or bulleted lists.
CKEDITOR_LIMITED_CONFIGURATION = {
    "language": "{{ language }}",
    "skin": "moono-lisa",
    "toolbarCanCollapse": False,
    "contentsCss": "/static/css/ckeditor.css",
    # Only enable following tag definitions
    "allowedContent": ["p", "b", "i", "ol", "ul", "li"],
    # Enabled showblocks as default behavior
    "startupOutlineBlocks": True,
    # Default toolbar configurations for djangocms_text_ckeditor
    "toolbar": "HTMLField",
    "toolbar_HTMLField": [
        ["Undo", "Redo"],
        ["Bold", "Italic"],
        ["Link", "Unlink"],
        ["NumberedList", "BulletedList", "-"],
    ],
}

# CKEditor configuration for formatting section title:
# only bold entity
CKEDITOR_INLINE_BOLD_CONFIGURATION = {
    "language": "{{ language }}",
    "skin": "moono-lisa",
    "toolbarCanCollapse": False,
    "contentsCss": "/static/css/ckeditor.css",
    # Only enable following tag definitions
    "allowedContent": ["strong"],
    # Block commands which adds break lines (Enter & Shift + Enter)
    # Enter Key Code = 13
    # CKEDITOR.SHIFT + Enter = 2228224 + 13 = 2228237
    "blockedKeystrokes": [13, 2228237],
    "keystrokes": [[13, None], [2228237, None]],
    # Enabled showblocks as default behavior
    "startupOutlineBlocks": True,
    # Default toolbar configurations for djangocms_text_ckeditor
    "toolbar_HTMLField": [
        ["Undo", "Redo"],
        ["Bold"],
    ],
    "enterMode": 2,
    "autoParagraph": False,
    "resize_enabled": False,
    "height": 68,
}

# Additional LinkPlugin templates. Note how choice value is just a keyword
# instead of full template path. Value is used inside a path formatting
# such as "templates/djangocms_link/VALUE/link.html"
DJANGOCMS_LINK_TEMPLATES = [("button-caesura", _("Button caesura"))]

DJANGOCMS_VIDEO_TEMPLATES = [("full-width", _("Full width"))]

# Richie plugins

RICHIE_PLAINTEXT_MAXLENGTH = {"course_introduction": 200, "bio": 150, "excerpt": 200}

RICHIE_SIMPLETEXT_CONFIGURATION = [
    {
        "placeholders": ["course_skills", "course_plan"],
        "ckeditor": "CKEDITOR_LIMITED_CONFIGURATION",
    },
    {
        "placeholders": ["course_description"],
        "ckeditor": "CKEDITOR_LIMITED_CONFIGURATION",
        "max_length": 1200,
    },
    {
        "placeholders": ["maincontent"],
        "ckeditor": "CKEDITOR_SETTINGS",
        "max_length": 5000,
    },
    {
        "placeholders": ["course_assessment", "course_format", "course_prerequisites"],
        "ckeditor": "CKEDITOR_BASIC_CONFIGURATION",
    },
]

RICHIE_SIMPLEPICTURE_PRESETS = {
    # Formatting images for the courses search index
    "cover": {
        "src": {"size": (300, 170), "crop": "smart"},
        "srcset": [
            {
                "options": {"size": (300, 170), "crop": "smart", "upscale": True},
                "descriptor": "300w",
            },
            {
                "options": {"size": (600, 340), "crop": "smart", "upscale": True},
                "descriptor": "600w",
            },
            {
                "options": {"size": (900, 560), "crop": "smart", "upscale": True},
                "descriptor": "900w",
            },
        ],
        "sizes": "300px",
    },
    "icon": {
        "src": {"size": (60, 60), "crop": "smart"},
        "srcset": [
            {
                "options": {"size": (60, 60), "crop": "smart", "upscale": True},
                "descriptor": "60w",
            },
            {
                "options": {"size": (120, 120), "crop": "smart", "upscale": True},
                "descriptor": "120w",
            },
            {
                "options": {"size": (180, 180), "crop": "smart", "upscale": True},
                "descriptor": "180w",
            },
        ],
        "sizes": "60px",
    },
}
