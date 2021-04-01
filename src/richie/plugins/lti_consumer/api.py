"""Declare API endpoints for LTI Consumer Plugin"""
from django.core.cache import caches
from django.core.cache.backends.base import InvalidCacheBackendError
from django.shortcuts import get_object_or_404

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from . import models


class LTIConsumerViewsSet(viewsets.GenericViewSet):
    """Viewset for LTI Consumer Plugin"""

    @action(methods=["get"], detail=True, url_path="context")
    # pylint: disable=no-self-use,unused-argument,invalid-name
    def get_context(self, request, version=None, pk=None):
        """Process context data for the LTI Consumer Plugin.

        Parameters:
        - pk: the primary key of the LTI Consumer plugin to get context

        Returns:
        - response (JSON Object):
            - url: the LTI resource url
            - content_paramters: all generated parameters related to the lti provider
            - automatic_resizing: boolean to control automatic resizing

        """
        edit = request.toolbar and request.toolbar.edit_mode_active
        cache_key = f"lti_consumer_plugin__pk_{pk}__edit_{edit}"

        try:
            cache = caches["memory_cache"]
            response = cache.get(cache_key)
            if response is not None:
                return Response(response)
        except InvalidCacheBackendError:
            cache = None

        plugin = get_object_or_404(models.LTIConsumer, pk=pk)
        response = {
            "automatic_resizing": plugin.automatic_resizing,
            "content_parameters": plugin.get_content_parameters(edit=edit),
            "url": plugin.url,
        }

        if cache is not None:
            # Cache the response for 9 minutes 30 seconds,
            # lti oauth credentials are stale after 10 minutes
            cache.set(cache_key, response, 9.5 * 60)

        return Response(response)
