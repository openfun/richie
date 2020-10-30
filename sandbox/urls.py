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

from richie.apps.courses.urls import urlpatterns as courses_urlpatterns
from richie.apps.search.urls import urlpatterns as search_urlpatterns

# For now, we use URLPathVersioning to be consistent with fonzie. Fonzie uses it
# because DRF OpenAPI only supports URLPathVersioning for now.
# See fonzie API_PREFIX config for more information.
API_PREFIX = r"v(?P<version>[0-9]+\.[0-9]+)"

admin.autodiscover()

urlpatterns = [
    path(r"sitemap.xml", sitemap, {"sitemaps": {"cmspages": CMSSitemap}}),
    re_path(
        r"api/{}/".format(API_PREFIX),
        include([*courses_urlpatterns, *search_urlpatterns]),
    ),
    path(r"oauth/", include("social_django.urls", namespace="social")),
    path(r"", include("filer.server.urls")),
]

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
