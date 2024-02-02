"""
Test suite for all utils in the `core` application
"""

from django.test import override_settings

from cms.api import Page
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import PageFactory
from richie.apps.core.helpers import create_i18n_page


class PagesTests(CMSTestCase):
    """Integration tests that actually render pages"""

    def test_pages_i18n_menu(self):
        """
        Create an i18n page and check its rendering on the site
        """
        content = {"fr": "Tableau de bord", "en": "Dashboard"}
        create_i18n_page(
            content,
            is_homepage=True,
            published=True,
            template="richie/single_column.html",
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

    @override_settings(
        LANGUAGES=(("fr-ca", "Canadian"), ("es", "Spanish")),
        LANGUAGE_CODE="fr-ca",
        CMS_LANGUAGES={},
    )
    def test_pages_i18n_hreflang(self):
        """
        The hreflang links should be configured to avoid duplicate content accross languages.
        """
        content = {"fr-ca": "Un, deux", "es": "uno, dos"}
        create_i18n_page(
            content,
            published=True,
            template="richie/single_column.html",
        )
        page = Page.objects.get(publisher_is_draft=False)

        # ... and make sure the hreflinks are on the page in all languages
        for language in ["fr-ca", "es"]:
            response = self.client.get(page.get_absolute_url(language))
            self.assertEqual(200, response.status_code)
            self.assertIn(
                (
                    '<link rel="alternate" href="http://example.com/fr-ca/un-deux/" '
                    'hreflang="fr-ca" />'
                ),
                response.rendered_content,
            )
            self.assertIn(
                '<link rel="alternate" href="http://example.com/es/uno-dos/" hreflang="es" />',
                response.rendered_content,
            )

    @override_settings(SENTRY_DSN="https://example.com/sentry/dsn")
    @override_settings(RELEASE="9.8.7")
    @override_settings(ENVIRONMENT="test_pages")
    @override_settings(
        RICHIE_LMS_BACKENDS=[
            {
                "BASE_URL": "https://lms.example.com",
                "BACKEND": "richie.apps.courses.lms.edx.EdXLMSBackend",
                "COURSE_REGEX": r"^https://lms\.example\.com/courses/(?P<course_id>.*)/course/?$",
                "JS_BACKEND": "dummy",
                "JS_COURSE_REGEX": r"^https://lms\.example\.com/courses/(.*)/course/?$",
            }
        ]
    )
    @override_settings(
        FEATURES={"FEATURE_FLAG": True},
        WEB_ANALYTICS={"google_universal_analytics": {"tracking_id": "TRACKING_ID"}},
    )
    def test_page_includes_frontend_context(self):
        """
        Create a page and make sure it includes the frontend context as included
        in `base.html`. All characters for use in javascript string should be escaped
        (i.e: '"' should be escaped with \u0022 and '\' with \u005C) to prevent an issue when
        this variable contains unescaped characters for javascript (e.g: '\').

        ⚠️ If this test fails, before fixing it, identify if this change has had
        ⚠️ an impact on frontend and update frontend accordingly.
        """
        page = PageFactory(should_publish=True, template="richie/single_column.html")

        response = self.client.get(page.get_public_url())
        self.assertContains(
            response, r"\u0022environment\u0022: \u0022test_pages\u0022"
        )
        self.assertContains(response, r"\u0022release\u0022: \u00229.8.7\u0022")
        self.assertContains(
            response,
            r"\u0022sentry_dsn\u0022: \u0022https://example.com/sentry/dsn\u0022",
        )
        self.assertContains(response, r"\u0022lms_backends\u0022: [")
        self.assertContains(
            response, r"\u0022endpoint\u0022: \u0022https://lms.example.com\u0022"
        )
        self.assertContains(response, r"\u0022backend\u0022: \u0022dummy\u0022")
        self.assertContains(
            response,
            (
                r"\u0022course_regexp\u0022: "
                r"\u0022^https://lms\u005C\u005C.example\u005C\u005C.com/courses/(.*)/course/?$\u0022"  # noqa pylint: disable=line-too-long
            ),
        )
        self.assertContains(
            response,
            r"\u0022web_analytics_providers\u0022: \u0022[\u005C\u0022google_universal_analytics\u005C\u0022]\u0022,",  # noqa pylint: disable=line-too-long
        )

        self.assertContains(
            response,
            r"\u0022features\u0022: {\u0022FEATURE_FLAG\u0022: true}",  # noqa pylint: disable=line-too-long
        )

        self.assertContains(
            response,
            r"\u0022site_urls\u0022: {\u0022terms_and_conditions\u0022: null",
        )

    def test_page_includes_frontend_context_site_urls(self):
        """
        The frontend context should contains site urls to pass down to react application
        Indeed, terms and conditions page should be returned if it exists and
        is published in the request language.
        """

        page = PageFactory(should_publish=True, template="richie/single_column.html")

        response = self.client.get(page.get_public_url())

        # - No page exists yet, so terms and conditions should be null
        self.assertContains(
            response,
            r"\u0022site_urls\u0022: {\u0022terms_and_conditions\u0022: null",
        )

        # - Create a terms and conditions page
        terms_page = create_i18n_page(
            {"fr": "Conditions générales de vente", "en": "Terms and conditions"},
            template="richie/single_column.html",
            reverse_id="annex__terms_and_conditions",
        )

        response = self.client.get(page.get_public_url())

        # - The page exists but is not published, so terms and conditions should be null
        self.assertContains(
            response,
            r"\u0022site_urls\u0022: {\u0022terms_and_conditions\u0022: null",
        )

        # - Publish the page in English
        terms_page.publish("en")

        # - Request english page should return terms and conditions english page
        response = self.client.get(page.get_public_url())
        self.assertContains(
            response,
            r"\u0022site_urls\u0022: {\u0022terms_and_conditions\u0022: "
            r"\u0022/en/terms\u002Dand\u002Dconditions/\u0022",
        )

        # - Request french page should return terms and conditions page in English as the
        #   french version is not published
        response = self.client.get(page.get_public_url("fr"))
        self.assertContains(
            response,
            r"\u0022site_urls\u0022: {\u0022terms_and_conditions\u0022: "
            r"\u0022/fr/terms\u002Dand\u002Dconditions/\u0022",
        )

        # - Publish the page in French
        terms_page.publish("fr")

        # - Now request french page should return terms and conditions page in French
        response = self.client.get(page.get_public_url("fr"))
        self.assertContains(
            response,
            r"\u0022site_urls\u0022: {\u0022terms_and_conditions\u0022: "
            r"\u0022/fr/conditions\u002Dgenerales\u002Dde\u002Dvente/\u0022",
        )
