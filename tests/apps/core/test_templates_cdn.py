"""
Test for the dns prefetch
"""

from django.test.utils import override_settings

from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.helpers import create_i18n_page


class TemplatesCDNDomainTestCase(CMSTestCase):
    """Testing the base.html template"""

    def test_templates_cdn_domain_absent(self):
        """
        If the `CDN_DOMAIN` isn't defined, then the `public-path` meta should be absent.
        """
        homepage = create_i18n_page("my title", is_homepage=True)
        homepage.publish("en")
        url = homepage.get_absolute_url(language="en")
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertNotContains(
            response,
            '<meta name="public-path""',
        )

    @override_settings(CDN_DOMAIN="xyz.acdn.net")
    def test_templates_cdn_domain(self):
        """
        If the `CDN_DOMAIN` setting is defined then the `public-path` meta should contain
        the value of the CDN, so the React JS bundles can be loaded using that domain.
        """
        homepage = create_i18n_page("my title", is_homepage=True)
        homepage.publish("en")
        url = homepage.get_absolute_url(language="en")
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertContains(
            response,
            '<meta name="public-path" value="xyz.acdn.net" />',
        )
