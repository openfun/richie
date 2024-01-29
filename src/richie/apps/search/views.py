"""Views for richie's search application."""

from django.contrib import messages
from django.core import management
from django.http import HttpResponse
from django.utils.encoding import force_str
from django.utils.translation import gettext_lazy as _
from django.views.decorators.cache import cache_page

from rest_framework.decorators import api_view
from rest_framework.response import Response

from .defaults import FILTERS_PRESENTATION
from .filter_definitions import FILTERS


@api_view(["POST"])
# pylint: disable=unused-argument
def bootstrap_elasticsearch(request, version):
    """Regenerate the Elasticsearch index."""
    user = request.user
    if not (user.is_staff and request.user.has_perm("search.can_manage_elasticsearch")):
        return HttpResponse(
            force_str(_("You are not allowed to manage the search index.")),
            status=403 if request.user.is_authenticated else 401,
        )

    management.call_command("bootstrap_elasticsearch")

    messages.info(request, _("The search index was successfully bootstrapped"))
    return Response({})


@api_view(["GET"])
@cache_page(60 * 60 * 2)
# pylint: disable=unused-argument
def filter_definitions(request, version):
    """
    Make available on an API route the static parts of filter definitions.
    This is useful to some frontend components that need them to configure themselves.
    """
    filters = {
        name: faceted_definition
        for filter in FILTERS.values()
        for name, faceted_definition in filter.get_definition().items()
        if name in FILTERS_PRESENTATION
    }
    for name in filters:
        filters[name]["position"] = FILTERS_PRESENTATION.index(name)

    return Response(filters)
