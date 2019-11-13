"""Views for richie's search application."""
from django.contrib import messages
from django.core import management
from django.http import HttpResponse
from django.utils.encoding import force_text
from django.utils.translation import ugettext_lazy as _

from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["POST"])
# pylint: disable=unused-argument
def bootstrap_elasticsearch(request, version):
    """Regenerate the Elasticsearch index."""
    user = request.user
    if not (user.is_staff and request.user.has_perm("search.can_manage_elasticsearch")):
        return HttpResponse(
            force_text(_("You are not allowed to manage the search index.")),
            status=403 if request.user.is_authenticated else 401,
        )

    management.call_command("bootstrap_elasticsearch")

    messages.info(request, _("The search index was successfully bootstrapped"))
    return Response({})
