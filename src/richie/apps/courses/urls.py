"""
API routes exposed by our Courses app.
"""
from django.urls import re_path

from rest_framework import routers

from .api import CourseRunsViewSet, course_runs_sync

ROUTER = routers.SimpleRouter()

# Define our app's API routes with the router
ROUTER.register("course-runs", CourseRunsViewSet, "course_runs")

urlpatterns = ROUTER.urls + [
    re_path("course-runs-sync/?$", course_runs_sync, name="course_run_sync"),
]
