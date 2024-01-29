"""End-to-end tests for the search page."""

import re

from django.test.utils import override_settings

from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.helpers import create_i18n_page


@override_settings(RFC_5646_LOCALES=["en-US", "fr-CA", "fr-FR", "es-ES"])
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
        self.assertIsNotNone(
            re.search(
                (
                    r'<html lang="en-US">.*'
                    r'<h1 class="subheader__title">search</h1>.*'
                    r"<div[\\n ]*"
                    r'class="richie-react richie-react--search"[\\n ]*'
                ),
                str(response.content),
            )
        )

        # In french, the Canadian french locale should get selected
        page.publish("fr")
        url = page.get_absolute_url(language="fr")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(
            re.search(
                (
                    r'<html lang="fr-CA">.*'
                    r'<h1 class="subheader__title">recherche</h1>.*'
                    r"<div[\\n ]*"
                    r'class="richie-react richie-react--search"[\\n ]*'
                ),
                str(response.content),
            )
        )
