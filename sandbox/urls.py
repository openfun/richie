"""
FUN CMS urls
"""

from django.conf import settings
from django.conf.urls.i18n import i18n_patterns
from django.contrib import admin
from django.contrib.sitemaps.views import sitemap
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.urls import include, path, re_path
from django.views.generic import TemplateView
from django.views.static import serve

from cms.sitemaps import CMSSitemap

from richie.apps.core.templatetags.feature_flags import is_feature_enabled
from richie.apps.core.templatetags.joanie import is_joanie_enabled
from richie.apps.courses.urls import (
    redirects_urlpatterns as courses_redirects_urlpatterns,
)
from richie.apps.courses.urls import urlpatterns as courses_urlpatterns
from richie.apps.search.urls import urlpatterns as search_urlpatterns
from richie.plugins.urls import urlpatterns as plugins_urlpatterns

# For now, we use URLPathVersioning to be consistent with fonzie. Fonzie uses it
# because DRF OpenAPI only supports URLPathVersioning for now.
# See fonzie API_PREFIX config for more information.
API_PREFIX = r"v(?P<version>[0-9]+\.[0-9]+)"

admin.autodiscover()
admin.site.enable_nav_sidebar = False


urlpatterns = [
    # Add sitemap.xml URL to the robots.txt so we don't need to register sitemap.xml from each
    # crawler administration panel
    path(
        "robots.txt",
        TemplateView.as_view(
            template_name="richie/robots.html", content_type="text/plain"
        ),
    ),
    path(r"sitemap.xml", sitemap, {"sitemaps": {"cmspages": CMSSitemap}}),
    re_path(
        rf"api/{API_PREFIX:s}/",
        include([*courses_urlpatterns, *search_urlpatterns, *plugins_urlpatterns]),
    ),
    re_path(r"^redirects/", include([*courses_redirects_urlpatterns])),
    path(r"", include("filer.server.urls")),
]

if is_joanie_enabled() and is_feature_enabled("REACT_DASHBOARD"):
    urlpatterns += i18n_patterns(
        re_path(
            r"^dashboard/.*",
            TemplateView.as_view(
                template_name="richie/dashboard.html",
            ),
            name="dashboard",
        )
    )

urlpatterns += i18n_patterns(
    path(r"admin/", admin.site.urls),
    path(r"accounts/", include("django.contrib.auth.urls")),
    path(
        r"styleguide/",
        TemplateView.as_view(
            template_name="richie/styleguide/index.html",
            extra_context={"STYLEGUIDE": settings.STYLEGUIDE},
        ),
        name="styleguide",
    ),
    path(r"", include("cms.urls")),  # NOQA
)

# This is only needed when using runserver.
if settings.DEBUG:
    urlpatterns = (
        [
            path(
                r"media/<path:path>",
                serve,
                {"document_root": settings.MEDIA_ROOT, "show_indexes": True},
            )
        ]
        + staticfiles_urlpatterns()
        + urlpatterns
    )

handler400 = "richie.apps.core.views.error.error_400_view_handler"
handler403 = "richie.apps.core.views.error.error_403_view_handler"
handler404 = "richie.apps.core.views.error.error_404_view_handler"
handler500 = "richie.apps.core.views.error.error_500_view_handler"
