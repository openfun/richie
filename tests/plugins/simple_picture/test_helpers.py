"""Testing helpers for Richie's simple picture plugin."""

from unittest import mock

from django.test import TestCase

from filer.utils.filer_easy_thumbnails import FilerThumbnailer

from richie.plugins.simple_picture.defaults import SIMPLEPICTURE_PRESETS
from richie.plugins.simple_picture.factories import PictureFactory
from richie.plugins.simple_picture.helpers import get_picture_info


class DummyThumbnail:
    """
    A dummy thumbnail to use as return value for the `get_thumbnail` method of a thumbnailer.
    """

    url = "/dummy-url"


class SimplePictureHelpersTestCase(TestCase):
    """Test suite to secure the behavior of the `get_picture_info` helper."""

    @mock.patch.dict(
        SIMPLEPICTURE_PRESETS,
        {
            "my-preset": {
                "src": {"size": (500, 500), "crop": "smart"},
                "srcset": [
                    {
                        "options": {"size": (1000, 1000), "crop": "smart"},
                        "descriptor": "1000w",
                    },
                    {
                        "options": {"size": (2000, 2000), "crop": "smart"},
                        "descriptor": "2000w",
                    },
                ],
                "sizes": "100vw",
            }
        },
    )
    @mock.patch.object(FilerThumbnailer, "get_thumbnail", return_value=DummyThumbnail())
    def test_helpers_simplepicture_get_picture_info_success(self, mock_thumbnail, *_):
        """
        The `get_picture_info` method should compute and return thumbnails urls and other
        attributes.
        """
        simple_picture = PictureFactory()
        info = get_picture_info(simple_picture, "my-preset")

        self.assertEqual(
            info,
            {
                "sizes": "100vw",
                "src": "/dummy-url",
                "srcset": "/dummy-url 1000w, /dummy-url 2000w",
            },
        )
        self.assertEqual(mock_thumbnail.call_count, 3)
        location = simple_picture.picture.subject_location
        self.assertEqual(
            mock_thumbnail.call_args_list,
            [
                mock.call(
                    {"size": (500, 500), "crop": "smart", "subject_location": location}
                ),
                mock.call(
                    {
                        "crop": "smart",
                        "size": (1000, 1000),
                        "subject_location": location,
                    }
                ),
                mock.call(
                    {
                        "crop": "smart",
                        "size": (2000, 2000),
                        "subject_location": location,
                    }
                ),
            ],
        )

    @mock.patch.dict(
        SIMPLEPICTURE_PRESETS, {"my-preset": {"src": {"size": (500, 500)}}}
    )
    @mock.patch.object(FilerThumbnailer, "get_thumbnail", return_value=DummyThumbnail())
    def test_helpers_simplepicture_get_picture_info_minimal(self, mock_thumbnail):
        """srcset and sizes are optional attributes in settings."""
        simple_picture = PictureFactory()
        info = get_picture_info(simple_picture, "my-preset")

        self.assertEqual(info, {"sizes": None, "src": "/dummy-url", "srcset": None})
        self.assertEqual(mock_thumbnail.call_count, 1)
        location = simple_picture.picture.subject_location
        self.assertEqual(
            mock_thumbnail.call_args_list,
            [mock.call({"size": (500, 500), "subject_location": location})],
        )

    def test_helpers_simplepicture_get_picture_info_no_picture(self):
        """
        The `get_picture_info` method should not fail and raise an error if it encounters
        a picture without an image.
        """
        simple_picture = PictureFactory(picture=None)
        info = get_picture_info(simple_picture, "my-preset")
        self.assertEqual(info, None)
