"""
API Routes exposed by our Search app
"""
from django.urls import path

from rest_framework import routers

from .views import bootstrap_elasticsearch, filter_definitions
from .viewsets.categories import CategoriesViewSet
from .viewsets.courses import CoursesViewSet
from .viewsets.organizations import OrganizationsViewSet
from .viewsets.persons import PersonsViewSet

# Instantiate a router
ROUTER = routers.SimpleRouter()

# Define our app's routes with the router
ROUTER.register(r"courses", CoursesViewSet, "courses")
ROUTER.register(r"organizations", OrganizationsViewSet, "organizations")
ROUTER.register(r"persons", PersonsViewSet, "persons")
ROUTER.register(r"(?P<kind>\w+)", CategoriesViewSet, "categories")

# Use the standard name for our urlpatterns so urls.py can import it effortlessly
urlpatterns = [
    path(
        r"bootstrap-elasticsearch/",
        bootstrap_elasticsearch,
        name="bootstrap_elasticsearch",
    ),
    path(r"filter-definitions/", filter_definitions, name="filter_definitions"),
]

urlpatterns += ROUTER.urls
