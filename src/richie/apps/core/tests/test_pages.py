"""
Test suite for all utils in the `core` application
"""
from cms.api import Page
from cms.test_utils.testcases import CMSTestCase

from ..helpers import create_i18n_page


class CreateCmsDataTests(CMSTestCase):
    """Create CMS data base test case"""

    def test_pages_i18n(self):
        """
        Create an i18n page and check its rendering on the site
        """
        content = {"fr": "Tableau de bord", "en": "Dashboard"}
        create_i18n_page(
            content, is_homepage=True, published=True, template="richie/fullwidth.html"
        )
        # Get the root page in french...
        root = Page.objects.get_home()
        response = self.client.get(root.get_absolute_url("fr"))
        self.assertEqual(200, response.status_code)
        # ... and make sure the page menu is present in french on the page
        self.assertIn(content["fr"], response.rendered_content)

        # Get the root page in english...
        response = self.client.get(root.get_absolute_url("en"))
        self.assertEqual(200, response.status_code)
        # ... and make sure the page menu is present in english on the page
        self.assertIn(content["en"], response.rendered_content)
