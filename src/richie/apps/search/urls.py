"""
API Routes exposed by our Search app
"""
from rest_framework import routers

from .viewsets.categories import CategoriesViewSet
from .viewsets.courses import CoursesViewSet
from .viewsets.organizations import OrganizationsViewSet
from .viewsets.persons import PersonsViewSet

# Instantiate a router
ROUTER = routers.SimpleRouter()

# Define our app's routes with the router
ROUTER.register(r"categories", CategoriesViewSet, "categories")
ROUTER.register(r"courses", CoursesViewSet, "courses")
ROUTER.register(r"organizations", OrganizationsViewSet, "organizations")
ROUTER.register(r"persons", PersonsViewSet, "persons")

# Use the standard name for our urlpatterns so urls.py can import it effortlessly
urlpatterns = ROUTER.urls
