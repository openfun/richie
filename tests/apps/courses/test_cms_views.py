# -*- coding: utf-8 -*-
"""
Unit tests for the Person views
"""
from django.conf import settings
from django.test.utils import override_settings
from django.urls import reverse_lazy

from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses import factories


@override_settings(LANGUAGES=(("en", "En"), ("fr", "Fr"), ("de", "De")))
@override_settings(
    CMS_LANGUAGES={
        "default": {
            "public": True,
            "hide_untranslated": False,
            "redirect_on_fallback": False,
            "fallbacks": ["en", "fr", "de"],
        }
    }
)
class PluginAutocompleteTestCase(CMSTestCase):
    """
    Test that PersonPlugin autocomplete view correctly returns results as expected

    NOTE: We use 'assertCountEqual' on list assertions since expected results are not
    strongly ordered and sometimes this leaded to test failures with 'assertEqual'.
    """

    def _test_cms_views_autocomplete_permission(self, model_name, factory_class):
        """
        The autocomplete view should return results only to authenticated users with
        the right permission.
        """
        url = reverse_lazy(
            "page-admin-autocomplete",
            kwargs={"model_name": model_name, "version": "1.0"},
        )

        extension = factory_class(page_title={"en": "donald duck", "fr": "donald duck"})
        page = extension.extended_object
        page.publish("en")
        page.publish("fr")

        can_view = f"courses.view_{model_name}"

        # Non authenticated user don't have any results
        payload = self.client.get(url, follow=True).json()
        self.assertEqual(len(payload["results"]), 0)

        # Authenticated user needs permissions
        user = UserFactory()
        self.client.login(username=user.username, password="password")
        payload = self.client.get(url, follow=True).json()
        self.assertEqual(len(payload["results"]), 0)

        # Non staff user even with the right permission don't have any results
        admin_1 = UserFactory(permissions=[can_view])
        self.client.login(username=admin_1.username, password="password")
        payload = self.client.get(url, follow=True).json()
        self.assertEqual(len(payload["results"]), 0)

        # Staff user with view permission is allowed to have results
        admin_2 = UserFactory(is_staff=True, permissions=[can_view])
        self.client.login(username=admin_2.username, password="password")
        payload = self.client.get(url, follow=True).json()
        self.assertEqual(len(payload["results"]), 1)

        # Superuser passby
        superuser = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=superuser.username, password="password")
        payload = self.client.get(url, follow=True).json()
        self.assertEqual(len(payload["results"]), 1)

    def _test_cms_views_autocomplete_label_translation(self, model_name, factory_class):
        """
        Autocomplete view should return the right title according to the current client
        language.
        """
        url = reverse_lazy(
            "page-admin-autocomplete",
            kwargs={"model_name": model_name, "version": "1.0"},
        )

        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        extension = factory_class(page_title={"en": "a title", "fr": "un titre"})
        page = extension.extended_object
        page.publish("en")
        page.publish("fr")

        # Getting response with default language returns titles in default language
        payload = self.client.get(url, follow=True).json()
        self.assertEqual(payload["results"][0]["text"], "a title")

        # Setting language to french with accurate cookie returns titles in french
        # language
        self.client.cookies.load({settings.LANGUAGE_COOKIE_NAME: "fr"})
        payload = self.client.get(url, follow=True).json()
        self.assertEqual(payload["results"][0]["text"], "un titre")

    def _test_cms_views_autocomplete_list(self, model_name, factory_class):
        """
        Autocomplete view should return list of all objects with the right title in the
        current language.
        """
        url = reverse_lazy(
            "page-admin-autocomplete",
            kwargs={"model_name": model_name, "version": "1.0"},
        )

        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create unpublished Person only for english

        # Create pages named from Picsou/Scrooge universe, characters may have their
        # names depending language
        page_titles = [
            {"en": "donald duck", "fr": "donald duck"},
            {"en": "scrooge mcduck", "fr": "balthazar picsou", "de": "dagobert duck"},
            {"en": "flintheart glomgold", "fr": "archibald gripsou"},
            {"en": "gladstone gander", "de": "gustav gans"},
        ]
        for title in page_titles:
            extension = factory_class(page_title=title)
            page = extension.extended_object
            if "en" in title:
                page.publish("en")
            if "fr" in title:
                page.publish("fr")
            if "de" in title:
                page.publish("de")

        # Listing with default language (english)
        response = self.client.get(url, follow=True)
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        titles = [item["text"] for item in payload["results"]]
        self.assertCountEqual(
            titles,
            [
                "donald duck",
                "scrooge mcduck",
                "flintheart glomgold",
                "gladstone gander",
            ],
        )

        # Set language to french and list all Persons
        self.client.cookies.load({settings.LANGUAGE_COOKIE_NAME: "fr"})
        payload = self.client.get(url, follow=True).json()
        titles = [item["text"] for item in payload["results"]]
        self.assertCountEqual(
            titles,
            [
                "donald duck",
                "balthazar picsou",
                "archibald gripsou",
                "gladstone gander",
            ],
        )

        # Set language to german and list all Persons
        self.client.cookies.load({settings.LANGUAGE_COOKIE_NAME: "de"})
        payload = self.client.get(url, follow=True).json()
        titles = [item["text"] for item in payload["results"]]
        self.assertCountEqual(
            titles,
            ["donald duck", "dagobert duck", "flintheart glomgold", "gustav gans"],
        )

    def _test_cms_views_autocomplete_search(self, model_name, factory_class):
        """
        Autocomplete view should return the right results with search keyword.
        """
        url = reverse_lazy(
            "page-admin-autocomplete",
            kwargs={"model_name": model_name, "version": "1.0"},
        )

        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create unpublished Person only for english

        # Create objects named from Picsou/Scrooge universe, characters may have their
        # names depending language
        page_titles = [
            {"en": "donald duck", "fr": "donald duck"},
            {"en": "scrooge mcduck", "fr": "balthazar picsou"},
            {"en": "flintheart glomgold", "fr": "archibald gripsou"},
            {"en": "gladstone gander"},
        ]
        for title in page_titles:
            extension = factory_class(page_title=title)
            page = extension.extended_object
            if "en" in title:
                page.publish("en")
            if "fr" in title:
                page.publish("fr")

        # Search with default language (english)
        data = {"q": "Duck"}
        payload = self.client.get(url, follow=True, data=data).json()
        titles = [item["text"] for item in payload["results"]]
        self.assertCountEqual(titles, ["donald duck", "scrooge mcduck"])

        # Set language to french and search for a keyword that should match for english
        # and french
        self.client.cookies.load({settings.LANGUAGE_COOKIE_NAME: "fr"})
        data = {"q": "Duck"}
        payload = self.client.get(url, follow=True, data=data).json()
        titles = [item["text"] for item in payload["results"]]
        self.assertCountEqual(
            titles,
            [
                "donald duck",
                # NOTE: Found 'scrooge mcduck' but display its french translation title
                "balthazar picsou",
            ],
        )

        # Keep language to french and search for a keyword that should match in french
        # only
        data = {"q": "picsou"}
        payload = self.client.get(url, follow=True, data=data).json()
        titles = [item["text"] for item in payload["results"]]
        self.assertCountEqual(titles, ["balthazar picsou"])


# Programmatically create test methods from the `_test_*` methods above. One set of test
# methods for each model that has these features.
TEST_PREFIX = "_test_cms_views_autocomplete"
for name, related_factory in (
    ("blogpost", factories.BlogPostFactory),
    ("category", factories.CategoryFactory),
    ("course", factories.CourseFactory),
    ("organization", factories.OrganizationFactory),
    ("person", factories.PersonFactory),
    ("program", factories.ProgramFactory),
):
    for method in (
        f for f in dir(PluginAutocompleteTestCase) if f.startswith(TEST_PREFIX)
    ):
        setattr(
            PluginAutocompleteTestCase,
            str(method).replace(TEST_PREFIX, f"{TEST_PREFIX[1:]}_{name}"),
            lambda self, m=method, n=name, rf=related_factory: getattr(
                PluginAutocompleteTestCase, str(m)
            )(self, n, rf),
        )
