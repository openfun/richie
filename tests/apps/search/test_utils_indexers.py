"""
Tests for the indexer helpers.
"""
from django.test import TestCase

from richie.apps.search.indexers import IndicesList
from richie.apps.search.indexers.courses import CoursesIndexer
from richie.apps.search.indexers.organizations import OrganizationsIndexer
from richie.apps.search.utils.indexers import slice_string_for_completion


class UtilsIndexersTestCase(TestCase):
    """
    Test any functions we're exposing for use in our indexers.
    """

    def test_indices_list(self):
        """The IndicesList instance gives access to indices via properties or iteration."""
        indices = IndicesList(
            courses="richie.apps.search.indexers.courses.CoursesIndexer",
            organizations="richie.apps.search.indexers.organizations.OrganizationsIndexer",
        )
        self.assertEqual(indices.courses, CoursesIndexer)
        self.assertEqual(list(indices), [CoursesIndexer, OrganizationsIndexer])

    def test_slice_string_for_completion(self):
        """
        The slice_string_for_completion function slices a string into an array of strings suitable
        for use in a completion field.

        This means including all strings contained in the original string, that begin after a
        space and end at the end of the original string.
        """
        self.assertEqual(slice_string_for_completion(""), [])
        self.assertEqual(slice_string_for_completion("Physics"), ["Physics"])
        self.assertEqual(
            slice_string_for_completion("Communication dans les organisations"),
            [
                "Communication dans les organisations",
                "dans les organisations",
                "les organisations",
                "organisations",
            ],
        )
        # Trailing spaces are discarded and strings trimmed as those spaces are not useful &
        # ES rejects empty strings from completion mappings
        self.assertEqual(
            slice_string_for_completion("Université Paris 18 "),
            ["Université Paris 18", "Paris 18", "18"],
        )
