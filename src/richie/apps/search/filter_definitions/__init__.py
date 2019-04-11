"""Make all filter definitions available from richie.apps.search.filter_definitions."""
from django.conf import settings
from django.utils.module_loading import import_string

# pylint: disable=unused-import
from ..defaults import FILTERS_CONFIGURATION
from .base import NestingWrapper  # noqa
from .courses import (  # noqa
    AvailabilityFilterDefinition,
    IndexableFilterDefinition,
    LanguagesFilterDefinition,
    StaticChoicesFilterDefinition,
)

FILTERS = {
    params["name"]: import_string(path)(**params)
    for path, params in getattr(
        settings, "RICHIE_FILTERS_CONFIGURATION", FILTERS_CONFIGURATION
    )
}
