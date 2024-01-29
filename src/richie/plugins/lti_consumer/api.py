"""Declare API endpoints for LTI Consumer Plugin"""

from django.core.cache import caches
from django.core.cache.backends.base import InvalidCacheBackendError
from django.http import JsonResponse
from django.utils import translation

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
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
            - content_parameters: all generated parameters related to the lti provider
            - is_automatic_resizing: boolean to control automatic resizing

        """
        language = translation.get_language()
        edit = request.toolbar and request.toolbar.edit_mode_active
        user_infos = request.GET.dict()

        if user_infos.get("user_id") is None:
            return Response({"user_id": ["This parameter is required."]}, status=400)

        cache_key = (
            f"lti_consumer_plugin__pk_{pk}_{user_infos.get('user_id')}_{language}"
        )

        # Send response from cache only if edition is off
        if edit:
            cache = None
        else:
            try:
                cache = caches["memory_cache"]
            except InvalidCacheBackendError:
                cache = None
            else:
                response = cache.get(cache_key)
                if response is not None:
                    return JsonResponse(response)

        plugin = get_object_or_404(models.LTIConsumer, pk=pk)

        # If edition is on, check permissions to make sure it is also allowed
        # before granting the instructor role
        edit = edit and plugin.placeholder.has_change_plugin_permission(
            request.user, plugin
        )

        response = {
            "is_automatic_resizing": plugin.get_is_automatic_resizing(),
            "content_parameters": plugin.get_content_parameters(
                user_infos=user_infos, edit=edit
            ),
            "url": plugin.url,
        }

        if cache is not None:
            # Cache the response for 5 minutes,
            # lti oauth credentials are stale after this delay.
            cache.set(cache_key, response, 5 * 60)

        return JsonResponse(response)
