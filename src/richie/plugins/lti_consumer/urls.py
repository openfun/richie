"""LTI Consumer plugin URLs configuration."""

from django.urls import include, path

from rest_framework.routers import DefaultRouter

from . import models
from .api import LTIConsumerViewsSet

router = DefaultRouter()
router.register(
    models.LTIConsumer.RESOURCE_NAME,
    LTIConsumerViewsSet,
    basename="lti-consumer",
)

url_patterns = [path("", include(router.urls))]
