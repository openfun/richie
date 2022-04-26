"""
Test for the dashboard page
"""
from django.test.utils import override_settings

from cms.test_utils.testcases import CMSTestCase


class TemplatesRichieDashboardTestCase(CMSTestCase):
    """Testing the dashboard.html template"""

    @override_settings(JOANIE={"BASE_URL": "https://joanie.test"})
    def test_templates_richie_dashboard_joanie_enabled(self):
        """
        Dashboard view should be reachable if JOANIE is enabled
        """
        response = self.client.get("/fr/dashboard/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, r'class="richie-react richie-react--dashboard"')

    @override_settings(JOANIE={})
    def test_templates_richie_dashboard_joanie_is_not_enabled(self):
        """
        Dashboard view should not be reachable if JOANIE is disabled
        """
        response = self.client.get("/fr/dashboard/")

        self.assertEqual(response.status_code, 404)
