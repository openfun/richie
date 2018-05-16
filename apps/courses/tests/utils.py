"""Test utils for the courses application"""

from django.test.client import RequestFactory

from cms.middleware.toolbar import ToolbarMiddleware


def get_toolbar_for_page(page, user, edit, preview):
    """
    This method is a helper to build a request to test the toolbar in different states
    for different users
    """
    url = page.get_absolute_url()
    factory = RequestFactory()

    if edit:
        url = "{:s}?edit".format(url)
    else:
        url = "{:s}?edit_off".format(url)

    if preview:
        url = "{:s}&preview".format(url)

    request = factory.get(url)
    request.user = user
    request.current_page = page
    request.session = {}

    middleware = ToolbarMiddleware()
    middleware.process_request(request)

    # pylint: disable=no-member
    request.toolbar.get_left_items()
    return request.toolbar
