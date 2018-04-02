"""
API Routes exposed by our Search app
"""
from rest_framework import routers

from .viewsets.course import CourseViewSet
from .viewsets.organization import OrganizationViewSet
from .viewsets.subject import SubjectViewSet


# For now, we use URLPathVersioning to be consistent with fonzie. Fonzie uses it
# because DRF OpenAPI only supports URLPathVersioning for now.
# See fonzie API_PREFIX config for more information.
API_PREFIX = r'v(?P<version>[0-9]+\.[0-9]+)'

# Instantiate a router
ROUTER = routers.SimpleRouter()

# Define our app's routes with the router
ROUTER.register(r'course', CourseViewSet, 'course')
ROUTER.register(r'organization', OrganizationViewSet, 'organization')
ROUTER.register(r'subject', SubjectViewSet, 'subject')

# Use the standard name for our urlpatterns so urls.py can import it effortlessly
urlpatterns = ROUTER.urls
