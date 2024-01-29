"""
Unit tests for the `order_by` template filter.
"""

import random

from django.contrib.auth import get_user_model

from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.templatetags.extra_tags import order_by

User = get_user_model()


class OrderByFilterTestCase(CMSTestCase):
    """
    Unit test suite to validate the behavior of the `order_by` template filter.
    """

    def test_templatetags_extra_tags_order_by(self):
        """
        The query passed as argument should be ordered according to arguments.
        """
        for name, is_active in random.sample(
            [
                ("Léa", True),
                ("François", False),
                ("Géraldine", False),
                ("Gérard", True),
            ],
            4,
        ):
            UserFactory(username=name, is_active=is_active)

        self.assertEqual(
            ["Léa", "Gérard", "Géraldine", "François"],
            [u.username for u in order_by(User.objects.all(), "-username")],
        )
        self.assertEqual(
            ["François", "Géraldine", "Gérard", "Léa"],
            [u.username for u in order_by(User.objects.all(), "is_active,username")],
        )
        self.assertEqual(
            ["Gérard", "Léa", "François", "Géraldine"],
            [u.username for u in order_by(User.objects.all(), "-is_active,username")],
        )
