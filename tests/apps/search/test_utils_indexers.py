"""
Tests for the indexer helpers.
"""

from django.test import TestCase

from richie.apps.courses.defaults import DAY, HOUR, MINUTE, MONTH, WEEK
from richie.apps.search.indexers import IndicesList
from richie.apps.search.indexers.courses import CoursesIndexer
from richie.apps.search.indexers.organizations import OrganizationsIndexer
from richie.apps.search.utils.indexers import (
    get_course_pace,
    slice_string_for_completion,
)


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

    def test_get_course_pace(self):
        """
        Normalize course paces to minutes per week so they can be indexed
        on a single field.
        """

        # Paces based on units of time per unit of reference
        self.assertEqual(get_course_pace(effort=(350, MINUTE), duration=(35, DAY)), 70)
        self.assertEqual(get_course_pace(effort=(2, HOUR), duration=(2, DAY)), 420)

        self.assertEqual(get_course_pace(effort=(40, MINUTE), duration=(4, WEEK)), 10)
        self.assertEqual(get_course_pace(effort=(2, HOUR), duration=(2, WEEK)), 60)

        self.assertEqual(
            get_course_pace(effort=(1300, MINUTE), duration=(3, MONTH)), 100
        )
        self.assertEqual(get_course_pace(effort=(30, HOUR), duration=(6, MONTH)), 69)

        # Paces expressed as units of time that do not make sense default to None
        self.assertEqual(
            get_course_pace(effort=(30, MINUTE), duration=(60, MINUTE)), None
        )
        self.assertEqual(
            get_course_pace(effort=(2, HOUR), duration=(300, MINUTE)), None
        )

        self.assertEqual(get_course_pace(effort=(30, MINUTE), duration=(2, HOUR)), None)
        self.assertEqual(get_course_pace(effort=(3, HOUR), duration=(9, HOUR)), None)

        # When the duration or effort is absent, default to None
        self.assertEqual(get_course_pace(effort=(30, MINUTE)), None)
        self.assertEqual(get_course_pace(effort=None, duration=(30, MINUTE)), None)
