"""Django Configuration mixins for the Richie courses app."""
from configurations.utils import uppercase_attributes

from .. import settings


class RichieCoursesConfigurationMixin:
    """
    A Django Configuration mixin to set sensible defaults for the settings of Richie's
    courses apps.
    """

    def __new__(cls):
        """
        Set all settings as attributes of this class so it can be used as a mixin in
        Django Configuration.
        """
        for key, value in uppercase_attributes(settings).items():
            setattr(cls, key, value)
        return super().__new__(cls)
