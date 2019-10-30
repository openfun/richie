"""
API Routes exposed by our Core app
"""
from rest_framework import routers

from .api import UsersViewSet

# Instantiate a router
ROUTER = routers.SimpleRouter()

# Define our app's routes with the router
ROUTER.register(r"users", UsersViewSet, "users")

# Use the standard name for our urlpatterns so urls.py can import it effortlessly
urlpatterns = ROUTER.urls
