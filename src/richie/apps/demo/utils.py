"""Utils for the demo app of the Richie project."""
import os
import random

from django.conf import settings


def pick_image(image_type):
    """
    This function can be passed to our factories's `fill_*` method to dynamically pick a random
    image of a given type.

    It randomly picks-up an image from targeted directory (core fixtures directory +
    image type dir).

    Arguments:
        image_type (string): Directory name in fixtures directory that contains some images to
            pick up.

    Returns:
        callable: A function that picks a random image path for a given type of image (logo,
        banner,...)
    """

    def _pick_random(filename=None):
        """
        Pick a random file path from fixtures within the image type passed as argument to the
        parent function.
        """
        default_directory = os.path.join(os.path.dirname(__file__), "fixtures")
        fixtures_directory = getattr(
            settings, "RICHIE_DEMO_FIXTURES_DIR", default_directory
        )
        image_directory = os.path.join(fixtures_directory, image_type)

        if not os.path.exists(image_directory):
            # Fallback to the fixtures directory in the demo app
            image_directory = os.path.join(default_directory, image_type)

        filename = filename or random.choice(os.listdir(image_directory))  # nosec
        return os.path.join(image_directory, filename)

    return _pick_random
