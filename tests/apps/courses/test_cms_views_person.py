# -*- coding: utf-8 -*-
"""
Unit tests for the Person views
"""
from django.conf import settings
from django.test.utils import override_settings
from django.urls import reverse_lazy

from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.factories import PersonFactory


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
class PersonPluginAutocompleteTestCase(CMSTestCase):
    """
    Test that PersonPlugin autocomplete view correctly returns results as expected
    """

    _VIEW_URL = reverse_lazy(
        "person-page-admin-autocomplete", kwargs={"version": "1.0"}
    )

    def test_cms_views_autocomplete_permission(self):
        """
        The autocomplete view should return results only to authenticated users with
        the right permission.
        """
        person = PersonFactory(page_title={"en": "donald duck", "fr": "donald duck"})
        person_page = person.extended_object
        person_page.publish("en")
        person_page.publish("fr")

        can_view_person = "courses.view_person"

        # Non authenticated user don't have any results
        payload = self.client.get(self._VIEW_URL, follow=True).json()
        self.assertEqual(len(payload["results"]), 0)

        # Authenticated user needs permissions
        user = UserFactory()
        self.client.login(username=user.username, password="password")
        payload = self.client.get(self._VIEW_URL, follow=True).json()
        self.assertEqual(len(payload["results"]), 0)

        # Non staff user even with the right permission don't have any results
        admin_1 = UserFactory(permissions=[can_view_person])
        self.client.login(username=admin_1.username, password="password")
        payload = self.client.get(self._VIEW_URL, follow=True).json()
        self.assertEqual(len(payload["results"]), 0)

        # Staff user with view permission is allowed to have results
        admin_2 = UserFactory(is_staff=True, permissions=[can_view_person])
        self.client.login(username=admin_2.username, password="password")
        payload = self.client.get(self._VIEW_URL, follow=True).json()
        self.assertEqual(len(payload["results"]), 1)

        # Superuser passby
        superuser = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=superuser.username, password="password")
        payload = self.client.get(self._VIEW_URL, follow=True).json()
        self.assertEqual(len(payload["results"]), 1)

    def test_cms_views_autocomplete_label_translation(self):
        """
        Autocomplete view should return the right title according to the current client
        language.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        person = PersonFactory(page_title={"en": "a title", "fr": "un titre"})
        person_page = person.extended_object
        person_page.publish("en")
        person_page.publish("fr")

        # Getting response with default language returns titles in default language
        payload = self.client.get(self._VIEW_URL, follow=True).json()
        self.assertEqual(payload["results"][0]["text"], "a title")

        # Setting language to french with accurate cookie returns titles in french
        # language
        self.client.cookies.load({settings.LANGUAGE_COOKIE_NAME: "fr"})
        payload = self.client.get(self._VIEW_URL, follow=True).json()
        self.assertEqual(payload["results"][0]["text"], "un titre")

    def test_cms_views_autocomplete_list(self):
        """
        Autocomplete view should return list of all objects with the right title in the
        current language.

        NOTE: We stand on a queryset arbitrary order, that should be the order of
        created objects (through their id order).
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create unpublished Person only for english

        # Create persons named from Picsou/Scrooge universe, characters may have their
        # names depending language
        person_titles = [
            {"en": "donald duck", "fr": "donald duck"},
            {"en": "scrooge mcduck", "fr": "balthazar picsou", "de": "dagobert duck"},
            {"en": "flintheart glomgold", "fr": "archibald gripsou"},
            {"en": "gladstone gander", "de": "gustav gans"},
        ]
        for title in person_titles:
            person = PersonFactory(page_title=title)
            person_page = person.extended_object
            if "en" in title:
                person_page.publish("en")
            if "fr" in title:
                person_page.publish("fr")
            if "de" in title:
                person_page.publish("de")

        # Listing with default language (english)
        response = self.client.get(self._VIEW_URL, follow=True)
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        titles = [item["text"] for item in payload["results"]]
        self.assertEqual(
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
        payload = self.client.get(self._VIEW_URL, follow=True).json()
        titles = [item["text"] for item in payload["results"]]
        self.assertEqual(
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
        payload = self.client.get(self._VIEW_URL, follow=True).json()
        titles = [item["text"] for item in payload["results"]]
        self.assertEqual(
            titles,
            [
                "donald duck",
                "dagobert duck",
                "flintheart glomgold",
                "gustav gans",
            ],
        )

    def test_cms_views_autocomplete_search(self):
        """
        Autocomplete view should return the right results with search keyword.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create unpublished Person only for english

        # Create persons named from Picsou/Scrooge universe, characters may have their
        # names depending language
        person_titles = [
            {"en": "donald duck", "fr": "donald duck"},
            {"en": "scrooge mcduck", "fr": "balthazar picsou"},
            {"en": "flintheart glomgold", "fr": "archibald gripsou"},
            {"en": "gladstone gander"},
        ]
        for title in person_titles:
            person = PersonFactory(page_title=title)
            person_page = person.extended_object
            if "en" in title:
                person_page.publish("en")
            if "fr" in title:
                person_page.publish("fr")

        # Search with default language (english)
        data = {"q": "Duck"}
        payload = self.client.get(self._VIEW_URL, follow=True, data=data).json()
        titles = [item["text"] for item in payload["results"]]
        self.assertEqual(
            titles,
            [
                "donald duck",
                "scrooge mcduck",
            ],
        )

        # Set language to french and search for a keyword that should match for english
        # and french
        self.client.cookies.load({settings.LANGUAGE_COOKIE_NAME: "fr"})
        data = {"q": "Duck"}
        payload = self.client.get(self._VIEW_URL, follow=True, data=data).json()
        titles = [item["text"] for item in payload["results"]]
        self.assertEqual(
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
        payload = self.client.get(self._VIEW_URL, follow=True, data=data).json()
        titles = [item["text"] for item in payload["results"]]
        self.assertEqual(
            titles,
            [
                "balthazar picsou",
            ],
        )
