"""Testing factories for Richie's simple picture plugin."""

from django.test import TestCase

from richie.plugins.simple_picture.factories import PictureFactory


class PictureFactoriesTestCase(TestCase):
    """Test suite for Picturefactory."""

    def test_factories_simplepicture_create_success(self):
        """Factory creation success."""
        simple_picture = PictureFactory()
        self.assertIsNotNone(simple_picture.picture)
        self.assertTrue(1 <= simple_picture.picture.subject_location[0] <= 100)
        self.assertTrue(1 <= simple_picture.picture.subject_location[1] <= 100)
        self.assertIsNotNone(simple_picture.picture.default_alt_text)
        self.assertIsNotNone(simple_picture.picture.default_caption)
