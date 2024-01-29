"""
Test robots.txt template
"""

from django.test import TestCase


class RobotsTestCase(TestCase):
    """
    Test robots.txt template
    """

    def test_robots_sitemap(self):
        """
        robots.txt should contain the Sitemap rule
        """
        response = self.client.get("/robots.txt")
        self.assertContains(
            response,
            "Sitemap: http://example.com/sitemap.xml",
            msg_prefix="robots.txt should contain the Sitemap rule",
        )
