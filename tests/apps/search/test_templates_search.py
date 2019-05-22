"""End-to-end tests for the search page."""
from django.test.utils import override_settings

from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.helpers import create_i18n_page


@override_settings(REACT_LOCALES=["en_US", "fr_CA", "fr_FR", "es_ES"])
class CourseCMSTestCase(CMSTestCase):
    """End-to-end test suite to validate the content of the search page."""

    def test_templates_search_content(self):
        """Validate the content of a page using the search template."""
        page = create_i18n_page(
            {"fr": "recherche", "en": "search"}, template="search/search.html"
        )

        # The page should not be visible before it is published
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

        # Publish and ensure content is correct
        page.publish("en")

        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(
            response,
            '<div class="fun-react fun-react--search" data-locale="en_US"></div>',
            html=True,
        )

        # In french, the Canadian french locale should get selected
        page.publish("fr")
        url = page.get_absolute_url(language="fr")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(
            response,
            '<div class="fun-react fun-react--search" data-locale="fr_CA"></div>',
            html=True,
        )
