"""Declare API endpoints for LTI Consumer Plugin"""
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
        plugin = get_object_or_404(models.LTIConsumer, pk=pk)

        edit = request.toolbar and request.toolbar.edit_mode_active

        return Response(
            {
                "url": plugin.url,
                "content_parameters": plugin.get_content_parameters(edit=edit),
                "automatic_resizing": plugin.automatic_resizing,
            }
        )
