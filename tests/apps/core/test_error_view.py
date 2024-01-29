"""
Tests for error views
"""

from django.contrib.auth.models import AnonymousUser
from django.test import TestCase
from django.test.client import RequestFactory

from cms.api import create_page

from richie.apps.core.views import error


class ErrorViewHandlersTestCase(TestCase):
    """Test suite for the error view handlers"""

    def test_400_error_view_handler(self):
        """
        When a request is malformed,
        the 400 error view should be displayed
        """
        page = create_page("Test", "richie/single_column.html", "en", published=True)
        request = RequestFactory().get("/")
        request.current_page = page
        request.user = AnonymousUser()
        with self.assertTemplateUsed("richie/error.html"):
            response = error.error_400_view_handler(request, Exception)
            self.assertContains(response, "400 - Bad request", status_code=400)

    def test_403_error_view_handler(self):
        """
        When access to page is not allowed,
        the 403 error view should be displayed
        """
        page = create_page("Test", "richie/single_column.html", "en", published=True)
        request = RequestFactory().get("/")
        request.current_page = page
        request.user = AnonymousUser()
        with self.assertTemplateUsed("richie/error.html"):
            response = error.error_403_view_handler(request, Exception)
            self.assertContains(response, "403 - Forbidden", status_code=403)

    def test_404_error_view_handler(self):
        """
        When a request does not found resource,
        the 404 error view should be displayed
        """
        page = create_page("Test", "richie/single_column.html", "en", published=True)
        request = RequestFactory().get("/")
        request.current_page = page
        request.user = AnonymousUser()
        with self.assertTemplateUsed("richie/error.html"):
            response = error.error_404_view_handler(request, Exception)
            self.assertContains(response, "404 - Page not found", status_code=404)

    def test_500_error_view_handler(self):
        """
        When an internal server occured,
        the 500 error view should be displayed
        """
        page = create_page("Test", "richie/single_column.html", "en", published=True)
        request = RequestFactory().get("/")
        request.current_page = page
        request.user = AnonymousUser()
        with self.assertTemplateUsed("richie/error.html"):
            response = error.error_500_view_handler(request, Exception)
            self.assertContains(response, "500 - Server bad request", status_code=500)

    def test_error_view_handler_with_unsupported_status_code(self):
        """
        When an unsupported status code is used,
        the 500 error view should be displayed
        """
        page = create_page("Test", "richie/single_column.html", "en", published=True)
        request = RequestFactory().get("/")
        request.current_page = page
        request.user = AnonymousUser()
        with self.assertTemplateUsed("richie/error.html"):
            response = error.error_view_handler(request, Exception, 405)
            self.assertContains(response, "500 - Server bad request", status_code=500)
