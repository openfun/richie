"""Django Configuration mixins for the Richie courses app."""
from configurations.utils import uppercase_attributes

from .. import settings


def apply_settings(cls):
    """A decorator to set class attributes from imported settings."""
    for key, value in uppercase_attributes(settings).items():
        setattr(cls, key, value)
    return cls


@apply_settings
class RichieCoursesConfigurationMixin:
    """
    A Django Configuration mixin to set sensible defaults for the settings of Richie's
    courses app.
    """
