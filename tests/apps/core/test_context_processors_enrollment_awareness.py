# -*- coding: utf-8 -*-
"""
Tests for the enrollment awareness rules context processor
"""

import json

from django.core.exceptions import ImproperlyConfigured
from django.test import TestCase
from django.test.utils import override_settings
from django.utils.translation import gettext_lazy as _

from richie.apps.core.context_processors import FrontendContextProcessor


class ContextProcessorEnrollmentAwarenessTestCase(TestCase):
    """Test suite for FrontendContextProcessor.get_enrollment_awareness_rules"""

    def setUp(self):
        self.processor = FrontendContextProcessor()

    def test_get_enrollment_awareness_rules_not_configured(self):
        """The context should be None when the setting is not defined or empty."""
        with self.settings():
            self.assertIsNone(self.processor.get_enrollment_awareness_rules())
        with override_settings(RICHIE_ENROLLMENT_AWARENESS_RULES=[]):
            self.assertIsNone(self.processor.get_enrollment_awareness_rules())

    @override_settings(
        RICHIE_ENROLLMENT_AWARENESS_RULES=[
            {
                "id": "free-course",
                "when": {"offer": ["free"]},
                "cta": {
                    "enroll": "Enroll now for free",
                    "login": "Log in to enroll for free",
                },
            },
            {
                "id": "external-platform",
                "when": {"is_external": True},
                "cta": {"enroll": "Enroll on the partner platform"},
                "message": {
                    "variant": "warning",
                    "text": "This course runs on another platform.",
                },
            },
            {
                "id": "paid-certificate",
                "when": {"certificate_offer": ["paid"], "languages": ["fr", "en"]},
                "message": {
                    "variant": "info",
                    "text": "A certificate is available for a fee.",
                },
            },
        ]
    )
    def test_get_enrollment_awareness_rules_serialization(self):
        """Valid rules should be serialized as is, keeping their order."""
        self.assertEqual(
            self.processor.get_enrollment_awareness_rules(),
            [
                {
                    "id": "free-course",
                    "when": {"offer": ["free"]},
                    "cta": {
                        "enroll": "Enroll now for free",
                        "login": "Log in to enroll for free",
                    },
                },
                {
                    "id": "external-platform",
                    "when": {"is_external": True},
                    "cta": {"enroll": "Enroll on the partner platform"},
                    "message": {
                        "variant": "warning",
                        "text": "This course runs on another platform.",
                    },
                },
                {
                    "id": "paid-certificate",
                    "when": {"certificate_offer": ["paid"], "languages": ["fr", "en"]},
                    "message": {
                        "variant": "info",
                        "text": "A certificate is available for a fee.",
                    },
                },
            ],
        )

    @override_settings(
        RICHIE_ENROLLMENT_AWARENESS_RULES=[
            {
                "id": "free-course",
                "when": {"offer": ["free"]},
                "cta": {"enroll": _("Enroll now")},
                "message": {"variant": "info", "text": _("Enrollment")},
            }
        ]
    )
    def test_get_enrollment_awareness_rules_lazy_translations(self):
        """
        Lazy translation strings should be rendered to plain strings so that the context can
        be serialized to JSON.
        """
        result = self.processor.get_enrollment_awareness_rules()
        self.assertIs(type(result[0]["cta"]["enroll"]), str)
        self.assertIs(type(result[0]["message"]["text"]), str)
        self.assertEqual(result[0]["cta"]["enroll"], "Enroll now")
        self.assertEqual(result[0]["message"]["text"], "Enrollment")
        # The whole context must be JSON serializable
        json.dumps(result)

    @override_settings(
        RICHIE_ENROLLMENT_AWARENESS_RULES=[
            {
                "id": "free-course",
                "when": {"offer": ["free"]},
                "cta": {"enroll": "Enroll now for free"},
            }
        ]
    )
    def test_context_processor_includes_enrollment_awareness_rules(self):
        """The rules should be exposed in the frontend context."""
        context = self.processor.context_processor(None)["context"]
        self.assertEqual(
            context["enrollment_awareness_rules"],
            [
                {
                    "id": "free-course",
                    "when": {"offer": ["free"]},
                    "cta": {"enroll": "Enroll now for free"},
                }
            ],
        )

    def test_context_processor_omits_enrollment_awareness_rules_when_not_configured(
        self,
    ):
        """The key should not be present in the frontend context when not configured."""
        context = self.processor.context_processor(None)["context"]
        self.assertNotIn("enrollment_awareness_rules", context)

    def assert_improperly_configured(self, rules, message):
        """Assert that the given rules raise ImproperlyConfigured with the given message."""
        with override_settings(RICHIE_ENROLLMENT_AWARENESS_RULES=rules):
            with self.assertRaises(ImproperlyConfigured) as context:
                self.processor.get_enrollment_awareness_rules()
        self.assertIn(message, str(context.exception))

    def test_get_enrollment_awareness_rules_validation(self):
        """Malformed rules should raise ImproperlyConfigured with an explicit message."""
        valid_cta = {"enroll": "Enroll"}
        self.assert_improperly_configured(["not a dict"], "[0] must be a dictionary")
        self.assert_improperly_configured(
            [{"when": {"offer": ["free"]}, "cta": valid_cta}], 'non-empty string "id"'
        )
        self.assert_improperly_configured(
            [
                {"id": "a", "when": {"offer": ["free"]}, "cta": valid_cta},
                {"id": "a", "when": {"offer": ["paid"]}, "cta": valid_cta},
            ],
            '[1] has a duplicate "id": a',
        )
        self.assert_improperly_configured(
            [{"id": "a", "cta": valid_cta}], 'non-empty "when" dictionary'
        )
        self.assert_improperly_configured(
            [{"id": "a", "when": {"categories": ["x"]}, "cta": valid_cta}],
            'unknown condition "categories"',
        )
        self.assert_improperly_configured(
            [{"id": "a", "when": {"offer": "free"}, "cta": valid_cta}],
            'condition "offer" must be a non-empty list',
        )
        self.assert_improperly_configured(
            [{"id": "a", "when": {"offer": []}, "cta": valid_cta}],
            'condition "offer" must be a non-empty list',
        )
        self.assert_improperly_configured(
            [{"id": "a", "when": {"is_external": "yes"}, "cta": valid_cta}],
            'condition "is_external" must be a non-empty bool',
        )
        self.assert_improperly_configured(
            [{"id": "a", "when": {"offer": ["free"]}}],
            'at least a "cta" or a "message"',
        )
        self.assert_improperly_configured(
            [{"id": "a", "when": {"offer": ["free"]}, "cta": {"other": "x"}}],
            '"cta" only accepts the "enroll" and "login" keys',
        )
        self.assert_improperly_configured(
            [{"id": "a", "when": {"offer": ["free"]}, "cta": {}}],
            '"cta" must be a non-empty dictionary',
        )
        self.assert_improperly_configured(
            [
                {
                    "id": "a",
                    "when": {"offer": ["free"]},
                    "message": {"variant": "error", "text": "x"},
                }
            ],
            '"message" must be a dictionary with a "variant"',
        )
        self.assert_improperly_configured(
            [{"id": "a", "when": {"offer": ["free"]}, "message": {"variant": "info"}}],
            '"message" must be a dictionary with a "variant"',
        )
