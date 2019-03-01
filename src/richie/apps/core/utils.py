"""
Utils common to all applications of the Richie CMS.
"""
import io
import os
import random


def file_getter(image_type):
    """
    This function can be passed to factory boy ImageField to dynamically generate
    image fields.

    It randomly picks-up an image from targeted directory (core fixtures directory +
    image type dir).

    Arguments:
        image_type (string): Directory name in fixtures directory that contains some images to
            pick up.

    Returns:
        callable: A function that picks a random image for a given type of image (logo,
        banner,...)
    """

    def pick_random(filename=None):
        """
        Pick a random file from fixtures within the image type passed as argument to the parent
        function.
        """
        image_directory = os.path.join(
            os.path.dirname(__file__), "fixtures", image_type
        )
        filename = filename or random.choice(os.listdir(image_directory))

        # Factory boy's "from_func" param is expecting a file but does not seem to close it
        # properly. Let's load the content of the file in memory and pass it as a BytesIO to
        # factory boy so that the file is nicely closed
        with open(os.path.join(image_directory, filename), "rb") as image_file:
            in_memory_file = io.BytesIO(image_file.read())
            in_memory_file.name = filename
        return in_memory_file

    return pick_random
