"""Error views"""

from django.shortcuts import render
from django.utils.translation import gettext_lazy as _

CONTEXT_ERRORS = {
    400: {
        "title": _("Bad request"),
        "content": _(
            "Your query seems to be malformed. Please check your data and try again."
        ),
    },
    403: {
        "title": _("Forbidden"),
        "content": _(
            "You do not have the required permissions to access this resource."
        ),
    },
    404: {
        "title": _("Page not found"),
        "content": _("The requested resource does not exist."),
    },
    500: {
        "title": _("Server bad request"),
        "content": _("Something went wrong. Please try again later."),
    },
}


def error_view_handler(request, exception, status):
    """
    Render error template with the related error context
    """
    if status not in [400, 403, 404, 500]:
        status = 500

    return render(
        request,
        template_name="richie/error.html",
        status=status,
        context={
            "error": exception,
            "status": status,
            "title": CONTEXT_ERRORS[status]["title"],
            "content": CONTEXT_ERRORS[status]["content"],
        },
    )


def error_400_view_handler(request, exception=None):
    """Error 400 view"""
    return error_view_handler(request, exception, 400)


def error_403_view_handler(request, exception=None):
    """Error 403 view"""
    return error_view_handler(request, exception, 403)


def error_404_view_handler(request, exception=None):
    """Error 404 view"""
    return error_view_handler(request, exception, 404)


def error_500_view_handler(request, exception=None):
    """Error 500 view"""
    return error_view_handler(request, exception, 500)
