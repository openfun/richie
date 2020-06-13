"""
API routes exposed by our Enrollments app.
"""
from rest_framework import routers

from .api import EnrollmentViewSet

# Instantiate a router
ROUTER = routers.SimpleRouter()

# Define our app's routes with the router
ROUTER.register(r"enrollments", EnrollmentViewSet, "enrollments")

# Use the standard name for our urlpatterns so urls.py can import it effortlessly
urlpatterns = ROUTER.urls
