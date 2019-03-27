"""
Unit tests for the PagePlaceholder template tag.
"""
from django.db import transaction
from django.test import RequestFactory

from cms.api import create_page, create_title
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.plugins.simple_text_ckeditor.cms_plugins import CKEditorPlugin
from richie.apps.core.templatetags.social_networks import BadgeRenderer


class BadgeRendererTestCase(CMSTestCase):
    """
    Unit test suite to validate the behavior of BadgeRenderer class.
    """

    @transaction.atomic
    def test_badgerenderer_get_context_nopage(self):
        """
        Context should should not be troubled if no page was given as argument
        """
        renderer = BadgeRenderer(lang=None)

        self.assertEqual(renderer.get_context("dummy-badge", {}), {
            "badge_name": "dummy-badge",
        })

    @transaction.atomic
    def test_badgerenderer_get_context_withpage(self):
        """
        Context should have related page variables when page is given as argument
        """
        user = UserFactory()
        page = create_page("Test", "richie/fullwidth.html", "en", published=True)

        renderer = BadgeRenderer(lang="en", page=page)

        self.assertEqual(renderer.get_context("dummy-badge", {}), {
            "badge_name": "dummy-badge",
            "page_title": "Test",
            'page_url': '/en/test/',
        })

    @transaction.atomic
    def test_badgerenderer_get_context_formattable(self):
        """
        Only formattable items should correctly include any other context items
        """
        user = UserFactory()
        page = create_page("Test", "richie/fullwidth.html", "en", published=True)

        renderer = BadgeRenderer(lang="en", page=page)

        initial_context = {
            "foo": "bar",
            "ping": "pong {{page_title}}",
            "url": "pong {{foo}} {{page_url}}",
            "content": "pong {{page_title}} {{foo}}",
        }

        self.assertEqual(renderer.get_context("dummy-badge", initial_context), {
            "badge_name": "dummy-badge",
            "page_title": "Test",
            'page_url': '/en/test/',
            "foo": "bar",
            "ping": "pong Test",
            "url": "pong bar /en/test/",
            "content": "pong Test bar",
        })

    @transaction.atomic
    def test_badgerenderer_get_context_i18n_withpage(self):
        """
        Context should be filled with the right variables from page with given
        language
        """
        user = UserFactory()
        page = create_page(
            language="en",
            menu_title="A test",
            title="A test",
            slug="atest",
            template="richie/fullwidth.html",
            published=True
        )
        create_title(
            page=page,
            language="fr",
            menu_title="Un test",
            title="Un test",
            slug="untest",
        )
        page.publish("fr")

        renderer = BadgeRenderer(lang="fr", page=page)

        self.assertEqual(renderer.get_context("dummy-badge", {}), {
            "badge_name": "dummy-badge",
            "page_title": "Un test",
            'page_url': '/fr/untest/',
        })

    @transaction.atomic
    def test_badgerenderer_get_context_i18n_no_page(self):
        """
        When no page is provided to renderer, it works also.
        """
        initial_context = {
            "foo": {
                "fr": "Mon test de badge",
                "en": "My badge test",
            },
            "bar": {
                "en": "Only english is available",
            },
        }

        renderer = BadgeRenderer(lang="en")

        self.assertEqual(renderer.get_context("dummy-badge", initial_context), {
            "badge_name": "dummy-badge",
            "foo": "My badge test",
            "bar": "Only english is available",
        })

    @transaction.atomic
    def test_badgerenderer_get_context_i18n_invalid_lang(self):
        """
        When a text has no translation for any available languages from
        ``settings.LANGUAGES``, renderer should raise a relevant exception.
        """
        initial_context = {
            "foo": {
                "fr": "Mon test de badge",
                "en": "My badge test",
            },
            "bar": {
                "es": "Mi case es su casa",
            },
        }

        renderer = BadgeRenderer(lang="en")

        with self.assertRaises(KeyError) as e:
            renderer.get_context("dummy-badge", initial_context)

        self.assertEqual(
            str(e.exception),
            ('"Social network badge \'dummy-badge\' item \'bar\' have no '
             'translation for available language from \'settings.LANGUAGES\'"')
        )

    @transaction.atomic
    def test_badgerenderer_get_context_i18n_fr(self):
        """
        Renderer should correctly use the best translation for given language.
        """
        user = UserFactory()

        # Create page in different language than the default one from
        # settings.LANGUAGE_CODE
        page = create_page(
            language="fr",
            menu_title="Un test",
            title="Un test",
            slug="untest",
            template="richie/fullwidth.html",
            published=True
        )
        create_title(
            language="en",
            menu_title="A test",
            title="A test",
            slug="atest",
            page=page,
        )
        page.publish("en")

        initial_context = {
            "dummy": "A simple text without translation",
            "foo": {
                "fr": "Mon test de badge pour '{{page_title}}'",
                "en": "My badge test for '{{page_title}}'",
            },
            "bar": {
                "en": "Only english is available",
            },
            "ping": {
                "fr": "Seulement du Français ici",
            },
        }

        renderer = BadgeRenderer(lang="fr", page=page)

        #response = self.client.get(page.get_absolute_url("fr"))
        #print(response.context_data)

        self.assertEqual(renderer.get_context("dummy-badge", initial_context), {
            "badge_name": "dummy-badge",
            "page_title": "Un test",
            'page_url': '/fr/untest/',
            "dummy": "A simple text without translation",
            "foo": "Mon test de badge pour 'Un test'",
            "bar": "Only english is available",
            "ping": "Seulement du Français ici",
        })


class BadgesTemplateTagsTestCase(CMSTestCase):
    """
    Unit test suite to validate the behavior of the "badges" template tag.
    """

    @transaction.atomic
    def test_templatetags_badges_no_current_page(self):
        """
        Templatetag should not be troubled when ``current_page`` variable does
        not exists from template context, to ensure tag works out of CMS page

        TODO: Will be finalized only when tag will render HTML
        """
        user = UserFactory()
        page = create_page("Test", "richie/fullwidth.html", "en", published=True)

        request = RequestFactory().get("/")
        request.current_page = page
        request.user = user

        template = (
            '{% load cms_tags social_networks %}{% badges "facebook-page" %}'
        )

        output = self.render_template_obj(template, {"page": page}, request)
        self.assertEqual("", output)

    @transaction.atomic
    def test_templatetags_badges_invalid_config_name(self):
        """
        Tag should raise a specific error when given config name does not exists
        """
        user = UserFactory()
        page = create_page("Test", "richie/fullwidth.html", "en", published=True)

        request = RequestFactory().get("/")
        request.current_page = page
        request.user = user

        template = (
            '{% load cms_tags social_networks %}{% badges "nope" %}'
        )

        with self.assertRaises(IndexError) as e:
            output = self.render_template_obj(template, {"page": page}, request)

        self.assertEqual(str(e.exception), "settings.SOCIAL_NETWORKS_BADGES has no item with name: nope")

    @transaction.atomic
    def test_templatetags_badges_i18n(self):
        """
        Ensure template tag get the right language code from context

        TODO: Will be finalized only when tag will render HTML
        """
        user = UserFactory()
        page = create_page(
            language="fr",
            menu_title="Un test",
            title="Un test",
            slug="untest",
            template="richie/fullwidth.html",
            published=True
        )
        create_title(
            language="en",
            menu_title="A test",
            title="A test",
            slug="atest",
            page=page,
        )
        page.publish("en")

        request = RequestFactory().get(page.get_absolute_url("fr"))
        request.current_page = page
        request.user = user

        template = (
            '{% load cms_tags social_networks %}{% badges "facebook-page" %}'
        )

        output = self.render_template_obj(template, {"page": page}, request)
        self.assertEqual("", output)
