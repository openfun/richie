"""
Test suite for the Open Graph of the homepage
"""

import re

from django.test.utils import override_settings

from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.helpers import create_i18n_page


class TemplatesRichieHomepageTestCase(CMSTestCase):
    """Testing the base.html template"""

    def test_templates_richie_homepage_meta_og_image(self):
        """
        Test if the homepage has the default og:image logo
        """
        homepage = create_i18n_page("my title", is_homepage=True)
        homepage.publish("en")
        url = homepage.get_absolute_url(language="en")
        response = self.client.get(url)
        response_content = response.content.decode("UTF-8")

        match = re.search("<meta[^>]+og:image[^>]+(/)?>", response_content)
        html_meta_og_image = match.group(0)
        self.assertIn(
            'content="http://testserver/static/richie/images/logo.png',
            html_meta_og_image,
        )
        self.assertIn("richie/images/logo.png", html_meta_og_image)

    @override_settings(STATIC_URL="https://xyz.cloudfront.net/static/")
    def test_templates_richie_homepage_meta_og_image_with_cdn(self):
        """
        Test if the homepage has the default og:image logo when using a CDN
        """
        homepage = create_i18n_page("my title", is_homepage=True)
        homepage.publish("en")
        url = homepage.get_absolute_url(language="en")
        response = self.client.get(url)
        response_content = response.content.decode("UTF-8")

        match = re.search("<meta[^>]+og:image[^>]+(/)?>", response_content)
        html_meta_og_image = match.group(0)
        self.assertIn(
            'content="https://xyz.cloudfront.net/static/richie/images/logo.png',
            html_meta_og_image,
        )
        self.assertIn("richie/images/logo.png", html_meta_og_image)
