"""
API routes exposed by our Courses app.
"""

from django.urls import path, re_path

from rest_framework import routers

from .api import CourseRunsViewSet, sync_course_runs_from_request
from .views import CourseCodeRedirectView, PageAdminAutocomplete

ROUTER = routers.SimpleRouter()

# Define our app's API routes with the router
ROUTER.register("course-runs", CourseRunsViewSet, "course_runs")

urlpatterns = ROUTER.urls + [
    re_path(
        "course-runs-sync/?$", sync_course_runs_from_request, name="course_run_sync"
    ),
    path(
        "page-admin-autocomplete/<slug:model_name>>/",
        PageAdminAutocomplete.as_view(),
        name="page-admin-autocomplete",
    ),
]

redirects_urlpatterns = [
    re_path(
        r"^courses/(?P<course_code>[\w]+)/?$",
        CourseCodeRedirectView.as_view(),
        name="redirect-course-code-to-course-url",
    ),
]
