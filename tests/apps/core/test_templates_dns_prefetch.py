"""
Test for the dns prefetch
"""

from django.test.utils import override_settings

from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.helpers import create_i18n_page


class TemplatesDNSPrefetchTestCase(CMSTestCase):
    """Testing the base.html template"""

    @override_settings(MEDIA_URL="//xyz.cloudfront.net/media/")
    def test_templates_media_cdn_dns_prefetch(self):
        """
        Check if using a CDN for the media, we are prefetching the DNS of its hostname.
        """
        homepage = create_i18n_page("my title", is_homepage=True)
        homepage.publish("en")
        url = homepage.get_absolute_url(language="en")
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertNotContains(
            response,
            '<link rel="preconnect"',
        )
        self.assertContains(
            response, '<link rel="dns-prefetch" href="//xyz.cloudfront.net/media/">'
        )

    @override_settings(
        MEDIA_URL="//xyz.cloudfront.net/media/", MEDIA_HOSTNAME_PRECONNECT=True
    )
    def test_templates_media_cdn_preconnect(self):
        """
        Check we are preconnecting to the CDN server when we are serving media through
        a CDN and `MEDIA_HOSTNAME_PRECONNECT` setting has been set to True
        """
        homepage = create_i18n_page("my title", is_homepage=True)
        homepage.publish("en")
        url = homepage.get_absolute_url(language="en")
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertContains(
            response,
            r'<link rel="preconnect" href="//xyz.cloudfront.net/media/" crossorigin>',
        )
