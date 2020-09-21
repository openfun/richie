"""Views for richie's core application."""
from django.conf import settings
from django.template.response import TemplateResponse


def logout(request):
    """
    A custom logout view to log out from Third Party Application
    in the same time as Richie
    """
    return TemplateResponse(
        request,
        "richie/logout.html",
        {
            "LOGOUT_URLS": [
                lms["LOGOUT_URL"]
                for lms in getattr(settings, "LMS_BACKENDS", [])
                if "LOGOUT_URL" in lms
            ],
            "LOGOUT_REDIRECT_URL": getattr(settings, "LOGOUT_REDIRECT_URL", "/"),
        },
    )
