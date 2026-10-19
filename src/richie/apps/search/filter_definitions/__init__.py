"""Make all filter definitions available from richie.apps.search.filter_definitions."""

from django.utils.module_loading import import_string

# pylint: disable=unused-import
from ..defaults import FILTERS_CONFIGURATION
from .base import BaseFilterDefinition, NestingWrapper  # noqa
from .courses import (  # noqa
    AvailabilityFilterDefinition,
    CertificateOfferFilterDefinition,
    IndexableFilterDefinition,
    IndexableHierarchicalFilterDefinition,
    LanguagesFilterDefinition,
    OfferFilterDefinition,
    StaticChoicesFilterDefinition,
)

FILTERS = {
    name: import_string(values["class"])(name, **values["params"])
    for name, values in FILTERS_CONFIGURATION.items()
}
