"""Testing DjangoCMS plugin declaration for Richie's simple picture plugin."""

from unittest import mock

from django.test import TestCase

from cms.api import add_plugin
from cms.models import Placeholder

from richie.apps.core.factories import FilerImageFactory
from richie.plugins.simple_picture.cms_plugins import SimplePicturePlugin


@mock.patch(
    "richie.plugins.simple_picture.cms_plugins.get_picture_info",
    return_value="picture info",
)
class SimplePicturePluginTestCase(TestCase):
    """Test suite for SimplePicturePlugin."""

    def test_cms_plugins_simplepicture_preset_placeholder(self, mock_picture):
        """
        Verify that we can instanciate the plugin with an instance.
        When the context is empty, the picture preset retrieved is the name of
        the placeholder.
        """
        placeholder = Placeholder.objects.create(slot="placeholder99")
        model_instance = add_plugin(
            placeholder, SimplePicturePlugin, "en", picture=FilerImageFactory()
        )
        plugin_instance = model_instance.get_plugin_class_instance()
        context = plugin_instance.render({}, model_instance, "placeholder99")

        # Check that the context includes the picture info and the picture instance
        self.assertEqual(
            context, {"picture_info": "picture info", "instance": model_instance}
        )

        mock_picture.assert_called_once_with(model_instance, "placeholder99")

    def test_cms_plugins_simplepicture_preset_context(self, mock_picture):
        """
        Verify that we can instanciate the plugin with an instance.
        When the context is empty, the picture preset retrieved is the name of
        the placeholder.
        """
        placeholder = Placeholder.objects.create(slot="placeholder99")
        model_instance = add_plugin(
            placeholder, SimplePicturePlugin, "en", picture=FilerImageFactory()
        )
        plugin_instance = model_instance.get_plugin_class_instance()
        context = plugin_instance.render(
            {"picture_preset": "preset88"}, model_instance, "placeholder99"
        )

        # Check that the context includes the picture info
        self.assertEqual(
            context,
            {
                "picture_info": "picture info",
                "picture_preset": "preset88",
                "instance": model_instance,
            },
        )

        mock_picture.assert_called_once_with(model_instance, "preset88")
