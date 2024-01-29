"""
Test suite for all helpers in the `core` application
"""

from unittest import mock

from django.test import TestCase

from richie.apps.core.admin import link_field


class _Meta:
    app_label = "app-label"
    model_name = "model-name"


class LinkedObj:
    """Related object stub to test the `linked_field` function."""

    id = 1
    _meta = _Meta()

    def __str__(self):
        return "My Linked Object"


class Obj:
    """Object stub to test the `linked_field` function."""

    my_field = LinkedObj()


class LinkFieldTestCase(TestCase):
    """
    The link_field function getter can be used in place of a readonly field in admin to
    display a link to the object's change form.
    """

    @mock.patch("richie.apps.core.admin.reverse", return_value="my-url")
    def test_admin_link_field(self, mock_reverse):
        """
        It should compute the reverse url of the object pointed by the field passed
        in argument.
        """
        method = link_field("my_field")
        self.assertEqual(
            method(Obj()),
            '<a target="_blank" rel="noopener noreferrer" href="my-url">My Linked Object</a>',
        )
        mock_reverse.assert_called_once_with(
            "admin:app-label_model-name_change", args=[1]
        )

    @mock.patch("richie.apps.core.admin.reverse", return_value="my-url")
    def test_admin_link_field_force_view_name(self, mock_reverse):
        """It should be possible to force the view name used to reverse the url."""
        method = link_field("my_field", view_name="my_view")
        self.assertEqual(
            method(Obj()),
            '<a target="_blank" rel="noopener noreferrer" href="my-url">My Linked Object</a>',
        )
        mock_reverse.assert_called_once_with("my_view", args=[1])

    @mock.patch("richie.apps.core.admin.reverse", return_value="my-url")
    def test_admin_link_field_force_anchor(self, mock_reverse):
        """It should be possible to force the anchor."""
        method = link_field("my_field", anchor="My Forced Anchor")
        self.assertEqual(
            method(Obj()),
            '<a target="_blank" rel="noopener noreferrer" href="my-url">My Forced Anchor</a>',
        )
        mock_reverse.assert_called_once_with(
            "admin:app-label_model-name_change", args=[1]
        )

    @mock.patch("richie.apps.core.admin.reverse", return_value="my-url")
    def test_admin_link_field_target_blank(self, mock_reverse):
        """
        It should be possible to disable the blank target.
        """
        method = link_field("my_field", target_blank=False)
        self.assertEqual(method(Obj()), '<a href="my-url">My Linked Object</a>')
        mock_reverse.assert_called_once_with(
            "admin:app-label_model-name_change", args=[1]
        )
