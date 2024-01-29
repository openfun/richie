"""Test demo views."""

from django.test import TestCase

from lxml import etree  # nosec

from richie.apps.core.factories import UserFactory


class DjangoCheckSeoTestCase(TestCase):
    """
    Test the Django Check SEO configuration
    """

    def test_views_django_check_seo_is_accessible(self):
        """
        Check that Django Check SEO is accessible by an admin user
        """
        url = "/django-check-seo/?page=/"
        response = self.client.get(url)

        # - Anonymous user is redirected to the admin login page
        self.assertEqual(response.status_code, 302)
        self.assertIn("/admin/login", response.url)

        # - Otherwise the Django Check SEO report is displayed
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")  # nosec

        response = self.client.get(url)
        html = etree.fromstring(response.content)
        page_title = html.cssselect("title")[0].text

        self.assertEqual(response.status_code, 200)
        self.assertEqual(page_title, "Django check SEO")
