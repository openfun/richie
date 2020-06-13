"""
API routes exposed by our Courses app.
"""
from rest_framework import routers

from .api import CourseRunsViewSet, EnrollmentViewSet

# Instantiate a router
ROUTER = routers.SimpleRouter()

# Define our app's routes with the router
ROUTER.register(r"course-runs", CourseRunsViewSet, "course-runs")
ROUTER.register(r"enrollments", EnrollmentViewSet, "enrollments")

# Use the standard name for our urlpatterns so urls.py can import it effortlessly
urlpatterns = ROUTER.urls
