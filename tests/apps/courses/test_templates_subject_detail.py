"""
End-to-end tests for the subject detail view
"""
from django.test import TestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.factories import SubjectFactory


class SubjectCMSTestCase(TestCase):
    """
    End-to-end test suite to validate the content and Ux of the subject detail view
    """

    def test_templates_subject_detail_cms_published_content(self):
        """
        Validate that the important elements are displayed on a published subject page
        """
        subject = SubjectFactory(title="Very interesting subject")
        page = subject.extended_object

        # The page should not be visible before it is published
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

        # Publish the subject and ensure the content is correct
        page.publish("en")
        response = self.client.get(url)
        self.assertContains(
            response,
            "<title>Very interesting subject en</title>",
            status_code=200,
            html=True,
        )
        self.assertContains(
            response,
            '<h1 class="subject-detail__title">Very interesting subject en</h1>',
            html=True,
        )

    def test_templates_subject_detail_cms_draft_content(self):
        """
        A staff user should see a draft subject including its draft elements with an annotation
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        subject = SubjectFactory(title="Very interesting subject")
        page = subject.extended_object

        # The page should be visible as draft to the staff user
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertContains(
            response,
            "<title>Very interesting subject en</title>",
            status_code=200,
            html=True,
        )
        self.assertContains(
            response,
            '<h1 class="subject-detail__title">Very interesting subject en</h1>',
            html=True,
        )
