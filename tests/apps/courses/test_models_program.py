"""
Unit tests for the Program model
"""

from decimal import Decimal

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.test.client import RequestFactory
from django.test.utils import override_settings
from django.utils import translation

from cms.api import add_plugin, create_page

from richie.apps.core.factories import PageFactory
from richie.apps.courses import factories
from richie.apps.courses.models import Program

# pylint: disable=too-many-public-methods


class ProgramModelsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Program model
    """

    def test_models_program_str(self):
        """
        The str representation should be built with the page title and code field only.
        A query to the associated page should be generated.
        """
        page = create_page("My first program", "courses/cms/program_detail.html", "en")
        program = Program(extended_object=page)
        with self.assertNumQueries(1):
            self.assertEqual(str(program), "Program: My first program")

    # Fields: price

    def test_models_program_field_price_default(self):
        """The effort field should default to None."""
        program = Program.objects.create(extended_object=PageFactory())
        self.assertEqual(program.price, Decimal("0.00"))

    def test_models_program_field_price_invalid(self):
        """The price should be a positive decimal number."""
        with self.assertRaises(ValidationError) as context:
            factories.ProgramFactory(price=-1)
        self.assertEqual(
            context.exception.messages[0],
            "Ensure this value is greater than or equal to 0.",
        )

    def test_models_program_field_price_null(self):
        """The price field can be null."""
        program = factories.ProgramFactory(price=None)
        self.assertIsNone(program.price)
        self.assertEqual(program.price_with_currency, "")

    def test_models_program_field_price_with_currency(self):
        """The price with currency should be a string."""
        program = factories.ProgramFactory(price=1)
        self.assertEqual(program.price_with_currency, "€1.00")

    # Fields: effort

    def test_models_program_field_effort_null(self):
        """The effort field can be null."""
        program = factories.ProgramFactory(effort=None)
        self.assertIsNone(program.effort)
        self.assertEqual(program.get_effort_display(), "")

    def test_models_program_field_effort_invalid(self):
        """An effort should be a pair: number, time unit."""
        with self.assertRaises(ValidationError) as context:
            factories.ProgramFactory(effort=[5])
        self.assertEqual(
            context.exception.messages[0],
            "A composite duration should be a pair: number and time unit.",
        )

    def test_models_program_field_effort_integer(self):
        """The first value of the effort pair should be an integer."""
        for value in ["a", "1.0"]:
            with self.assertRaises(ValidationError) as context:
                factories.ProgramFactory(effort=[value, "hour"])
            self.assertEqual(
                context.exception.messages[0],
                "A composite duration should be a round number of time units.",
            )

    def test_models_program_field_effort_positive(self):
        """The first value should be a positive integer."""
        with self.assertRaises(ValidationError) as context:
            factories.ProgramFactory(effort=[-1, "hour"])
        self.assertEqual(
            context.exception.messages[0], "A composite duration should be positive."
        )

    def test_models_program_field_effort_invalid_unit(self):
        """The second value should be a valid time unit choice."""
        with self.assertRaises(ValidationError) as context:
            factories.ProgramFactory(effort=[1, "invalid"])
        self.assertEqual(
            context.exception.messages[0],
            "invalid is not a valid choice for a time unit.",
        )

    def test_models_program_field_effort_display_singular(self):
        """Validate that a value of 1 time unit is displayed as expected."""
        program = factories.ProgramFactory(effort=[1, "hour"])
        self.assertEqual(program.get_effort_display(), "1 hour")

    def test_models_program_field_effort_display_plural(self):
        """Validate that a plural number of time units is displayed as expected."""
        program = factories.ProgramFactory(effort=[2, "hour"])
        self.assertEqual(program.get_effort_display(), "2 hours")

    def test_models_program_field_effort_display_request(self):
        """
        When used in the `render_model` template tag, it should not break when passed a
        request argument (the DjangoCMS frontend editing does it).
        """
        program = factories.ProgramFactory(effort=[1, "hour"])
        request = RequestFactory().get("/")
        self.assertEqual(program.get_effort_display(request), "1 hour")

    def test_models_program_field_effort_default(self):
        """The effort field should default to None."""
        program = Program.objects.create(extended_object=PageFactory())
        self.assertIsNone(program.effort)

    # Fields: duration

    def test_models_program_field_duration_null(self):
        """The duration field can be null."""
        program = factories.ProgramFactory(duration=None)
        self.assertIsNone(program.duration)
        self.assertEqual(program.get_duration_display(), "")

    def test_models_program_field_duration_invalid(self):
        """The duration should be a pair: number and unit."""
        with self.assertRaises(ValidationError) as context:
            factories.ProgramFactory(duration=5)
        self.assertEqual(
            context.exception.messages[0],
            "A composite duration should be a pair: number and time unit.",
        )

    def test_models_program_field_duration_integer(self):
        """The first value of the duration pair should be an integer."""
        for value in ["a", "1.0"]:
            with self.assertRaises(ValidationError) as context:
                factories.ProgramFactory(duration=[value, "minute"])
            self.assertEqual(
                context.exception.messages[0],
                "A composite duration should be a round number of time units.",
            )

    def test_models_program_field_duration_positive(self):
        """The first value should be a positive integer."""
        with self.assertRaises(ValidationError) as context:
            factories.ProgramFactory(duration=[-1, "day"])
        self.assertEqual(
            context.exception.messages[0], "A composite duration should be positive."
        )

    def test_models_program_field_duration_invalid_unit(self):
        """The second value should be a valid time unit choice."""
        with self.assertRaises(ValidationError) as context:
            factories.ProgramFactory(duration=[1, "invalid"])
        self.assertEqual(
            context.exception.messages[0],
            "invalid is not a valid choice for a time unit.",
        )

    def test_models_program_field_duration_display_singular(self):
        """Validate that a value of 1 time unit is displayed as expected."""
        program = factories.ProgramFactory(duration=[1, "day"])
        self.assertEqual(program.get_duration_display(), "1 day")

    def test_models_program_field_duration_display_plural(self):
        """Validate that a plural number of time units is displayed as expected."""
        program = factories.ProgramFactory(duration=[2, "day"])
        self.assertEqual(program.get_duration_display(), "2 days")

    def test_models_program_field_duration_display_request(self):
        """
        When used in the `render_model` template tag, it should not break when passed a
        request argument (the DjangoCMS frontend editing does it).
        """
        program = factories.ProgramFactory(duration=[1, "week"])
        request = RequestFactory().get("/")
        self.assertEqual(program.get_duration_display(request), "1 week")

    def test_models_program_field_duration_default(self):
        """The duration field should default to None."""
        program = Program.objects.create(extended_object=PageFactory())
        self.assertIsNone(program.duration)

    # Organizations

    def test_models_program_get_organizations_empty(self):
        """
        For a course not linked to any organzation the method `get_organizations` should
        return an empty query.
        """
        program = factories.ProgramFactory(should_publish=True)
        self.assertFalse(program.get_organizations().exists())
        self.assertFalse(program.public_extension.get_organizations().exists())

    def test_models_program_get_organizations(self):
        """
        The `get_organizations` method should return all organizations linked to a course and
        should respect publication status.
        """
        # The 2 first organizations are grouped in one variable name and will be linked to the
        # course in the following, the third category will not be linked so we can check that
        # only the organizations linked to the course are retrieved (its name starts with `_`
        # because it is not used and only here for unpacking purposes)
        *draft_organizations, _other_draft = factories.OrganizationFactory.create_batch(
            3
        )
        (
            *published_organizations,
            _other_public,
        ) = factories.OrganizationFactory.create_batch(3, should_publish=True)
        program = factories.ProgramFactory(
            fill_organizations=draft_organizations + published_organizations,
            should_publish=True,
        )

        self.assertEqual(
            list(program.get_organizations()),
            draft_organizations + published_organizations,
        )
        self.assertEqual(
            list(program.public_extension.get_organizations()), published_organizations
        )

    def test_models_program_get_organizations_language_current(self):
        """
        The `get_organizations` method should only return organizations linked to a course by
        a plugin in the current language.
        """
        organization_fr = factories.OrganizationFactory(page_languages=["fr"])
        organization_en = factories.OrganizationFactory(page_languages=["en"])

        program = factories.ProgramFactory(should_publish=True)
        placeholder = program.extended_object.placeholders.get(
            slot="program_organizations"
        )

        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="OrganizationPlugin",
            page=organization_en.extended_object,
        )
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="OrganizationPlugin",
            page=organization_fr.extended_object,
        )

        with translation.override("fr"):
            self.assertEqual(list(program.get_organizations()), [organization_fr])

        with translation.override("en"):
            self.assertEqual(list(program.get_organizations()), [organization_en])

    @override_settings(
        LANGUAGES=(("en", "en"), ("fr", "fr"), ("de", "de")),
        CMS_LANGUAGES={
            "default": {
                "public": True,
                "hide_untranslated": False,
                "redirect_on_fallback": False,
                "fallbacks": ["en", "fr", "de"],
            }
        },
    )
    def test_models_program_get_organizations_language_fallback(self):
        """
        The `get_organizations` method should return organizations linked to a course by
        a plugin in fallback language by order of falling back.
        """
        (
            organization1,
            organization2,
            organization3,
        ) = factories.OrganizationFactory.create_batch(3, should_publish=True)
        program = factories.ProgramFactory(should_publish=True)
        placeholder = program.extended_object.placeholders.get(
            slot="program_organizations"
        )

        # Plugin lookups should fallback up to the second priority language
        add_plugin(
            language="de",
            placeholder=placeholder,
            plugin_type="OrganizationPlugin",
            **{"page": organization1.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(program.get_organizations()), [organization1])

        with translation.override("fr"):
            self.assertEqual(list(program.get_organizations()), [organization1])

        with translation.override("de"):
            self.assertEqual(list(program.get_organizations()), [organization1])

        # Plugin lookups should fallback to the first priority language if available
        # and ignore the second priority language unless it is the current language
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="OrganizationPlugin",
            **{"page": organization2.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(program.get_organizations()), [organization2])

        with translation.override("fr"):
            self.assertEqual(list(program.get_organizations()), [organization2])

        with translation.override("de"):
            self.assertEqual(list(program.get_organizations()), [organization1])

        # Reverse plugin lookups should stick to the current language if available and
        # ignore plugins on fallback languages
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="OrganizationPlugin",
            **{"page": organization3.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(program.get_organizations()), [organization3])

        with translation.override("fr"):
            self.assertEqual(list(program.get_organizations()), [organization2])

        with translation.override("de"):
            self.assertEqual(list(program.get_organizations()), [organization1])

    # Category

    def test_models_program_get_categories_empty(self):
        """
        For a course not linked to any category the method `get_categories` should
        return an empty query.
        """
        program = factories.ProgramFactory(should_publish=True)
        self.assertFalse(program.get_categories().exists())
        self.assertFalse(program.public_extension.get_categories().exists())

    def test_models_program_get_categories(self):
        """
        The `get_categories` method should return all categories linked to a course and
        should respect publication status.
        """
        # The 2 first categories are grouped in one variable name and will be linked to the
        # course in the following, the third category will not be linked so we can check that
        # only the categories linked to the course are retrieved (its name starts with `_`
        # because it is not used and only here for unpacking purposes)
        *draft_categories, _other_draft = factories.CategoryFactory.create_batch(3)
        *published_categories, _other_public = factories.CategoryFactory.create_batch(
            3, should_publish=True
        )
        program = factories.ProgramFactory(
            fill_categories=draft_categories + published_categories, should_publish=True
        )

        self.assertEqual(
            list(program.get_categories()), draft_categories + published_categories
        )
        self.assertEqual(
            list(program.public_extension.get_categories()), published_categories
        )

    def test_models_program_get_categories_language(self):
        """
        The `get_categories` method should only return categories linked to a course by
        a plugin in the current language.
        """
        category_fr = factories.CategoryFactory(page_languages=["fr"])
        category_en = factories.CategoryFactory(page_languages=["en"])

        program = factories.ProgramFactory(should_publish=True)
        placeholder = program.extended_object.placeholders.get(
            slot="program_categories"
        )

        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            page=category_en.extended_object,
        )
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            page=category_fr.extended_object,
        )

        with translation.override("fr"):
            self.assertEqual(list(program.get_categories()), [category_fr])

        with translation.override("en"):
            self.assertEqual(list(program.get_categories()), [category_en])

    @override_settings(
        LANGUAGES=(("en", "en"), ("fr", "fr"), ("de", "de")),
        CMS_LANGUAGES={
            "default": {
                "public": True,
                "hide_untranslated": False,
                "redirect_on_fallback": False,
                "fallbacks": ["en", "fr", "de"],
            }
        },
    )
    def test_models_program_get_categories_language_fallback(self):
        """
        The `get_categories` method should return categories linked to a course by
        a plugin in fallback language by order of falling back.
        """
        category1, category2, category3 = factories.CategoryFactory.create_batch(
            3, should_publish=True
        )
        program = factories.ProgramFactory(should_publish=True)
        placeholder = program.extended_object.placeholders.get(
            slot="program_categories"
        )

        # Plugin lookups should fallback up to the second priority language
        add_plugin(
            language="de",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category1.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(program.get_categories()), [category1])

        with translation.override("fr"):
            self.assertEqual(list(program.get_categories()), [category1])

        with translation.override("de"):
            self.assertEqual(list(program.get_categories()), [category1])

        # Plugin lookups should fallback to the first priority language if available
        # and ignore the second priority language unless it is the current language
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category2.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(program.get_categories()), [category2])

        with translation.override("fr"):
            self.assertEqual(list(program.get_categories()), [category2])

        with translation.override("de"):
            self.assertEqual(list(program.get_categories()), [category1])

        # Reverse plugin lookups should stick to the current language if available and
        # ignore plugins on fallback languages
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category3.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(program.get_categories()), [category3])

        with translation.override("fr"):
            self.assertEqual(list(program.get_categories()), [category2])

        with translation.override("de"):
            self.assertEqual(list(program.get_categories()), [category1])

    # Instructors

    def test_models_program_get_persons_empty(self):
        """
        For a course not linked to any person the method `get_persons` should
        return an empty query.
        """
        program = factories.ProgramFactory(should_publish=True)
        self.assertFalse(program.get_persons().exists())
        self.assertFalse(program.public_extension.get_persons().exists())

    def test_models_program_get_persons(self):
        """
        The `get_persons` method should return all persons linked to a course and
        should respect publication status.
        """
        # The 2 first persons are grouped in one variable name and will be linked to the
        # course in the following, the third person will not be linked so we can check that
        # only the persons linked to the course are retrieved (its name starts with `_`
        # because it is not used and only here for unpacking purposes)
        *draft_persons, _other_draft = factories.PersonFactory.create_batch(3)
        *published_persons, _other_public = factories.PersonFactory.create_batch(
            3, should_publish=True
        )
        program = factories.ProgramFactory(
            fill_team=draft_persons + published_persons, should_publish=True
        )

        self.assertEqual(list(program.get_persons()), draft_persons + published_persons)
        self.assertEqual(
            list(program.public_extension.get_persons()), published_persons
        )

    def test_models_program_get_persons_language(self):
        """
        The `get_persons` method should only return persons linked to a course by a plugin
        in the current language.
        """
        person_fr = factories.PersonFactory(page_languages=["fr"])
        person_en = factories.PersonFactory(page_languages=["en"])

        program = factories.ProgramFactory(should_publish=True)
        placeholder = program.extended_object.placeholders.get(slot="program_team")

        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PersonPlugin",
            page=person_en.extended_object,
        )
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="PersonPlugin",
            page=person_fr.extended_object,
        )

        with translation.override("fr"):
            self.assertEqual(list(program.get_persons()), [person_fr])

        with translation.override("en"):
            self.assertEqual(list(program.get_persons()), [person_en])

    @override_settings(
        LANGUAGES=(("en", "en"), ("fr", "fr"), ("de", "de")),
        CMS_LANGUAGES={
            "default": {
                "public": True,
                "hide_untranslated": False,
                "redirect_on_fallback": False,
                "fallbacks": ["en", "fr", "de"],
            }
        },
    )
    def test_models_program_get_persons_language_fallback(self):
        """
        The `get_persons` method should return persons linked to a course by
        a plugin in fallback language by order of falling back.
        """
        person1, person2, person3 = factories.PersonFactory.create_batch(
            3, should_publish=True
        )
        program = factories.ProgramFactory(should_publish=True)
        placeholder = program.extended_object.placeholders.get(slot="program_team")

        # Plugin lookups should fallback up to the second priority language
        add_plugin(
            language="de",
            placeholder=placeholder,
            plugin_type="PersonPlugin",
            **{"page": person1.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(program.get_persons()), [person1])

        with translation.override("fr"):
            self.assertEqual(list(program.get_persons()), [person1])

        with translation.override("de"):
            self.assertEqual(list(program.get_persons()), [person1])

        # Plugin lookups should fallback to the first priority language if available
        # and ignore the second priority language unless it is the current language
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="PersonPlugin",
            **{"page": person2.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(program.get_persons()), [person2])

        with translation.override("fr"):
            self.assertEqual(list(program.get_persons()), [person2])

        with translation.override("de"):
            self.assertEqual(list(program.get_persons()), [person1])

        # Reverse plugin lookups should stick to the current language if available and
        # ignore plugins on fallback languages
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PersonPlugin",
            **{"page": person3.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(program.get_persons()), [person3])

        with translation.override("fr"):
            self.assertEqual(list(program.get_persons()), [person2])

        with translation.override("de"):
            self.assertEqual(list(program.get_persons()), [person1])
