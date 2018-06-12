"""
FUN CMS urls
"""
from django.conf import settings
from django.conf.urls import include, url
from django.conf.urls.i18n import i18n_patterns
from django.contrib import admin
from django.contrib.sitemaps.views import sitemap
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.views.static import serve

from cms.sitemaps import CMSSitemap

from apps.search.routes import API_PREFIX
from apps.search.routes import urlpatterns as search_urlpatterns

admin.autodiscover()

urlpatterns = [url(r"^sitemap\.xml$", sitemap, {"sitemaps": {"cmspages": CMSSitemap}})]

urlpatterns += [url(r"^api/{}/".format(API_PREFIX), include(search_urlpatterns))]

urlpatterns += i18n_patterns(
    url(r"^admin/", include(admin.site.urls)), url(r"^", include("cms.urls"))  # NOQA
)

# This is only needed when using runserver.
if settings.DEBUG:
    urlpatterns = (
        [
            url(
                r"^media/(?P<path>.*)$",
                serve,
                {"document_root": settings.MEDIA_ROOT, "show_indexes": True},
            )
        ]
        + staticfiles_urlpatterns()
        + urlpatterns
    )
