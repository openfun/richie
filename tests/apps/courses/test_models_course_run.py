"""
Unit tests for the Course model
"""

import random
from datetime import datetime, timedelta, timezone
from unittest import mock

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.test.client import RequestFactory
from django.utils import timezone as django_timezone
from django.utils import translation

from cms.constants import PUBLISHER_STATE_DEFAULT, PUBLISHER_STATE_DIRTY
from parler.utils.context import switch_language

from richie.apps.core.defaults import ALL_LANGUAGES
from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses.factories import CourseFactory, CourseRunFactory
from richie.apps.courses.models import CourseRun, CourseRunTranslation
from richie.apps.courses.models.course import CourseRunCatalogVisibility, CourseRunOffer


# pylint: disable=too-many-public-methods
class CourseRunModelsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the CourseRun model
    """

    def setUp(self):
        super().setUp()
        self.now = django_timezone.now()

    def test_models_course_run_get_course_direct_child_with_parent(self):
        """
        We should be able to retrieve the course from a course run that is its direct child
        when the course is below a root page (this is creating a difficulty because the
        query we build in `get_course` can create duplicates if we don't add the right clauses).
        """
        page = create_i18n_page("A page", published=True)
        course = CourseFactory(page_parent=page)
        course_run = CourseRunFactory(direct_course=course)
        self.assertTrue(course.extended_object.publish("en"))

        course.refresh_from_db()
        course_run.refresh_from_db()

        # Add a sibling course to make sure it is not returned
        CourseFactory(should_publish=True)

        # Add a snapshot to make sure it does not interfere
        CourseFactory(page_parent=course.extended_object, should_publish=True)

        self.assertEqual(course_run.get_course(), course)
        self.assertEqual(
            course_run.public_course_run.get_course(), course.public_extension
        )

    def test_models_course_run_get_course_direct_child(self):
        """
        We should be able to retrieve the course from a course run that is its direct child.
        """
        course = CourseFactory()
        course_run = CourseRunFactory(direct_course=course)
        self.assertTrue(course.extended_object.publish("en"))

        course.refresh_from_db()
        course_run.refresh_from_db()

        # Add a sibling course to make sure it is not returned
        CourseFactory(should_publish=True)

        # Add a snapshot to make sure it does not interfere
        CourseFactory(page_parent=course.extended_object, should_publish=True)

        self.assertEqual(course_run.get_course(), course)
        self.assertEqual(
            course_run.public_course_run.get_course(), course.public_extension
        )

    def test_models_course_run_get_course_child_of_snapshot(self):
        """
        We should be able to retrieve the course from a course run that is a child of one of
        its snapshots.
        """
        course = CourseFactory(should_publish=True)
        snapshot = CourseFactory(page_parent=course.extended_object)
        course_run = CourseRunFactory(direct_course=snapshot)
        self.assertTrue(snapshot.extended_object.publish("en"))
        course_run.refresh_from_db()

        # Add a sibling course to make sure it is not returned
        CourseFactory(should_publish=True)

        self.assertEqual(course_run.get_course(), course)
        self.assertEqual(
            course_run.public_course_run.get_course(), course.public_extension
        )

    def test_models_course_run_state_start_to_be_scheduled(self):
        """
        A course run that has no start date should return a state with priority 6
        and "to be scheduled" as text.
        """
        course_run = CourseRunFactory(start=None)
        self.assertEqual(
            dict(course_run.state),
            {
                "priority": 7,
                "text": "to be scheduled",
                "call_to_action": None,
                "datetime": None,
            },
        )

    def test_models_course_run_state_enrollment_start_to_be_scheduled(self):
        """
        A course run that has no enrollment start date should return a state with priority 6
        and "to be scheduled" as text.
        """
        course_run = CourseRunFactory(enrollment_start=None)
        self.assertEqual(
            dict(course_run.state),
            {
                "priority": 7,
                "text": "to be scheduled",
                "call_to_action": None,
                "datetime": None,
            },
        )

    def test_models_course_run_state_no_end_date(self):
        """
        A course run with no end date is deemed to be forever on-going.
        """
        course_run = CourseRunFactory(end=None)

        # The course run should be open during its enrollment period
        now = datetime.utcfromtimestamp(
            random.randrange(
                int(course_run.enrollment_start.timestamp()) + 1,
                int(course_run.enrollment_end.timestamp()) - 1,
            )
        ).replace(tzinfo=timezone.utc)

        with mock.patch.object(django_timezone, "now", return_value=now):
            state = course_run.state

        self.assertIn(dict(state)["priority"], [0, 1])

        # The course run should be on-going at any date after its end of enrollment
        now = datetime.utcfromtimestamp(
            random.randrange(
                int(course_run.enrollment_end.timestamp()),
                int(datetime(9999, 12, 31).timestamp()),
            )
        ).replace(tzinfo=timezone.utc)

        with mock.patch.object(django_timezone, "now", return_value=now):
            state = course_run.state

        self.assertEqual(
            dict(state),
            {
                "priority": 5,
                "text": "on-going",
                "call_to_action": None,
                "datetime": None,
            },
        )

    def test_models_course_run_state_no_enrollment_end(self):
        """
        A course run that has no end of enrollment is deemed to be always open.
        """
        course_run = CourseRunFactory(enrollment_end=None)

        # The course run should be open between its start of enrollment and its start
        now = datetime.utcfromtimestamp(
            random.randrange(
                int(course_run.enrollment_start.timestamp()) + 1,
                int(course_run.start.timestamp()) - 1,
            )
        ).replace(tzinfo=timezone.utc)

        with mock.patch.object(django_timezone, "now", return_value=now):
            state = course_run.state

        self.assertEqual(
            dict(state),
            {
                "priority": 1,
                "text": "starting on",
                "call_to_action": "enroll now",
                "datetime": course_run.start,
            },
        )

        # The course run should be on-going & open between its start and its end
        now = datetime.utcfromtimestamp(
            random.randrange(
                int(course_run.start.timestamp()) + 1,
                int(course_run.end.timestamp()) - 1,
            )
        ).replace(tzinfo=timezone.utc)

        with mock.patch.object(django_timezone, "now", return_value=now):
            state = course_run.state

        self.assertEqual(
            dict(state),
            {
                "priority": 0,
                "text": "forever open",
                "call_to_action": "enroll now",
                "datetime": None,
            },
        )

        # The course run should be archived open after its end
        now = datetime.utcfromtimestamp(
            random.randrange(
                int(course_run.end.timestamp()) + 1,
                int(datetime(9999, 12, 31).timestamp()) - 1,
            )
        ).replace(tzinfo=timezone.utc)

        with mock.patch.object(django_timezone, "now", return_value=now):
            state = course_run.state

        self.assertEqual(
            dict(state),
            {
                "priority": 2,
                "text": "forever open",
                "call_to_action": "study now",
                "datetime": None,
            },
        )

    def test_models_course_run_state_forever_open(self):
        """
        A course run that has no end of enrollement and no end should be forever open.
        """
        course_run = CourseRunFactory(enrollment_end=None, end=None)

        # The course run should be open between its start of enrollment and its start
        now = datetime.utcfromtimestamp(
            random.randrange(
                int(course_run.enrollment_start.timestamp()) + 1,
                int(course_run.start.timestamp()) - 1,
            )
        ).replace(tzinfo=timezone.utc)

        with mock.patch.object(django_timezone, "now", return_value=now):
            state = course_run.state

        self.assertEqual(
            dict(state),
            {
                "priority": 1,
                "text": "starting on",
                "call_to_action": "enroll now",
                "datetime": course_run.start,
            },
        )

        # The course run should be on-going & open forever after its start
        now = datetime.utcfromtimestamp(
            random.randrange(
                int(course_run.start.timestamp()) + 1,
                int(datetime(9999, 12, 31).timestamp()) - 1,
            )
        ).replace(tzinfo=timezone.utc)

        with mock.patch.object(django_timezone, "now", return_value=now):
            state = course_run.state

        self.assertEqual(
            dict(state),
            {
                "priority": 0,
                "text": "forever open",
                "call_to_action": "enroll now",
                "datetime": None,
            },
        )

    def test_models_course_run_state_archived_open_enrollment_opened(self):
        """
        A course run that is passed and has an enrollment end in the future should return
        a state with priority 2 and "closing on" as text.
        """
        course_run = CourseRunFactory(
            start=self.now - timedelta(hours=2),
            end=self.now - timedelta(hours=1),
            enrollment_end=self.now + timedelta(hours=1),
        )
        self.assertEqual(
            dict(course_run.state),
            {
                "priority": 2,
                "text": "closing on",
                "call_to_action": "study now",
                "datetime": course_run.enrollment_end,
            },
        )

    def test_models_course_run_state_archived_closed(self):
        """
        A course run that is passed should return a state with priority 6 and "archived"
        as text.
        """
        course_run = CourseRunFactory(
            start=self.now - timedelta(hours=2),
            end=self.now - timedelta(hours=1),
            enrollment_end=self.now - timedelta(hours=1),
        )
        self.assertEqual(
            dict(course_run.state),
            {
                "priority": 6,
                "text": "archived",
                "call_to_action": None,
                "datetime": None,
            },
        )

    def test_models_course_run_state_ongoing_open(self):
        """
        A course run that is on-going and open for enrollment should return a state with a CTA
        to enroll and the date of the end of enrollment.
        """
        course_run = CourseRunFactory(
            enrollment_start=self.now - timedelta(hours=3),
            start=self.now - timedelta(hours=2),
            enrollment_end=self.now + timedelta(hours=1),
            end=self.now + timedelta(hours=2),
        )
        self.assertEqual(
            dict(course_run.state),
            {
                "priority": 0,
                "text": "open for enrollment",
                "call_to_action": "enroll now",
                "datetime": None,
            },
        )

    def test_models_course_run_state_ongoing_closed(self):
        """
        A course run that is on-going but closed for enrollment should return a state with
        "on-going" as text and no CTA.
        """
        course_run = CourseRunFactory(
            enrollment_start=self.now - timedelta(hours=3),
            start=self.now - timedelta(hours=2),
            enrollment_end=self.now - timedelta(hours=1),
            end=self.now + timedelta(hours=1),
        )
        self.assertEqual(
            dict(course_run.state),
            {
                "priority": 5,
                "text": "on-going",
                "call_to_action": None,
                "datetime": None,
            },
        )

    def test_models_course_run_state_coming(self):
        """
        A course run that is future and not yet open for enrollment should return a state
        with a CTA to see details with the start date.
        """
        course_run = CourseRunFactory(
            enrollment_start=self.now + timedelta(hours=1),
            enrollment_end=self.now + timedelta(hours=2),
            start=self.now + timedelta(hours=3),
            end=self.now + timedelta(hours=4),
        )
        self.assertEqual(
            dict(course_run.state),
            {
                "priority": 3,
                "text": "starting on",
                "call_to_action": None,
                "datetime": self.now + timedelta(hours=3),
            },
        )

    def test_models_course_run_state_future_open(self):
        """
        A course run that is future and open for enrollment should return a state with a CTA
        to enroll and the start date.
        """
        course_run = CourseRunFactory(
            enrollment_start=self.now - timedelta(hours=1),
            enrollment_end=self.now + timedelta(hours=1),
            start=self.now + timedelta(hours=2),
            end=self.now + timedelta(hours=3),
        )
        self.assertEqual(
            dict(course_run.state),
            {
                "priority": 1,
                "text": "starting on",
                "call_to_action": "enroll now",
                "datetime": self.now + timedelta(hours=2),
            },
        )

    def test_models_course_run_state_future_closed(self):
        """
        A course run that is future and already closed for enrollment should return a state
        with "enrollment closed" as text and no CTA.
        """
        course_run = CourseRunFactory(
            enrollment_start=self.now - timedelta(hours=2),
            enrollment_end=self.now - timedelta(hours=1),
            start=self.now + timedelta(hours=1),
            end=self.now + timedelta(hours=2),
        )
        self.assertEqual(
            dict(course_run.state),
            {
                "priority": 4,
                "text": "enrollment closed",
                "call_to_action": None,
                "datetime": None,
            },
        )

    def test_models_course_run_field_languages_null(self):
        """
        The languages field should not be null.
        """
        with self.assertRaises(ValidationError) as context:
            CourseRunFactory(languages=None)
        self.assertEqual(context.exception.messages[0], "This field cannot be null.")

    def test_models_course_run_field_languages_blank(self):
        """
        The languages field should not be blank.
        """
        with self.assertRaises(ValidationError) as context:
            CourseRunFactory(languages=[])
        self.assertEqual(context.exception.messages[0], "This field cannot be blank.")

    def test_models_course_run_field_languages_max_choices(self):
        """
        The languages field should not accept more than 50 choices.
        """
        languages = [language[0] for language in ALL_LANGUAGES[:51]]

        # 50 languages should be fine
        CourseRunFactory(languages=languages[:-1])

        # 51 languages should fail
        with self.assertRaises(ValidationError) as context:
            CourseRunFactory(languages=languages)
        self.assertEqual(
            context.exception.messages[0], "You can only select up to 50 choices."
        )

    def test_models_course_run_field_languages_one_invalid(self):
        """
        When used in the `render_model` template tag, it should not break when passed a
        request argument.
        """
        with self.assertRaises(ValidationError) as context:
            CourseRunFactory(languages=["fr", "zzzzz"])
        self.assertEqual(
            context.exception.messages[0], "Value zzzzz is not a valid choice."
        )

    def test_models_course_run_field_languages_two_invalid(self):
        """
        When used in the `render_model` template tag, it should not break when passed a
        request argument.
        """
        with self.assertRaises(ValidationError) as context:
            CourseRunFactory(languages=["fr", "zzzzz", "de", "yyyyy"])
        self.assertEqual(
            context.exception.messages[0],
            "Values zzzzz and yyyyy are not valid choices.",
        )

    def test_models_course_run_field_languages_three_invalid(self):
        """
        When used in the `render_model` template tag, it should not break when passed a
        request argument.
        """
        with self.assertRaises(ValidationError) as context:
            CourseRunFactory(languages=["fr", "zzzzz", "yyyyy", "xxxxx"])
        self.assertEqual(
            context.exception.messages[0],
            "Values zzzzz, yyyyy and xxxxx are not valid choices.",
        )

    def test_models_course_run_get_languages_display_one_language(self):
        """
        With one language, it should return its readable version without any comma.
        """
        course_run = CourseRunFactory(languages=["fr"])
        self.assertEqual(course_run.get_languages_display(), "French")

    def test_models_course_run_get_languages_display_two_languages(self):
        """
        With 2 languages, it should return them joined with "them".
        """
        course_run = CourseRunFactory(languages=["fr", "en"])
        self.assertEqual(course_run.get_languages_display(), "English and french")

    def test_models_course_run_get_languages_display_three_languages(self):
        """
        With several languages, it should return a comma separated list of their readable
        version with "and" for the last one.
        """
        course_run = CourseRunFactory(languages=["fr", "en", "de"])
        self.assertEqual(
            course_run.get_languages_display(), "English, french and german"
        )

    def test_models_course_run_get_languages_display_translation_specific(self):
        """The languages display should be sorted by language display."""
        course_run = CourseRunFactory(languages=["fr", "en", "de"])

        with translation.override("fr"):
            self.assertEqual(
                course_run.get_languages_display(), "Allemand, anglais et français"
            )

    def test_models_course_run_get_languages_display_request(self):
        """
        When used in the `render_model` template tag, it should not break when passed a
        request argument (the DjangoCMS frontend editing does it).
        """
        course_run = CourseRunFactory(languages=["fr"])
        request = RequestFactory().get("/")
        self.assertEqual(course_run.get_languages_display(request), "French")

    def test_models_course_run_copy_translations_all_languages(self):
        """
        The "copy_translations" method should port parler's translations for all languages
        from one course run to the other.
        """
        course_run = CourseRunFactory(title="my title")
        CourseRunTranslation.objects.create(
            master=course_run, language_code="fr", title="mon titre"
        )
        old_course_run = CourseRun.objects.get(pk=course_run.pk)
        self.assertEqual(CourseRunTranslation.objects.count(), 2)
        with switch_language(old_course_run, "fr"):
            self.assertEqual(old_course_run.title, "mon titre")

        course_run.pk = None
        course_run.save()
        self.assertEqual(CourseRunTranslation.objects.count(), 2)

        course_run.copy_translations(old_course_run)

        self.assertEqual(CourseRun.objects.count(), 2)
        self.assertEqual(CourseRunTranslation.objects.count(), 4)
        self.assertEqual(
            CourseRunTranslation.objects.filter(master=course_run).count(), 2
        )

        course_run.refresh_from_db()
        self.assertEqual(course_run.title, "my title")
        with switch_language(course_run, "fr"):
            self.assertEqual(course_run.title, "mon titre")

    def test_models_course_run_copy_translations_one_language(self):
        """
        The "copy_translations" method called for a specific language should only port parler's
        translations for this language from one course run to the other.
        """
        course_run = CourseRunFactory(title="my title")
        CourseRunTranslation.objects.create(
            master=course_run, language_code="fr", title="mon titre"
        )
        old_course_run = CourseRun.objects.get(pk=course_run.pk)
        self.assertEqual(CourseRunTranslation.objects.count(), 2)
        with switch_language(old_course_run, "fr"):
            self.assertEqual(old_course_run.title, "mon titre")

        course_run.pk = None
        course_run.save()
        self.assertEqual(CourseRunTranslation.objects.count(), 2)

        course_run.copy_translations(old_course_run, language="fr")

        self.assertEqual(CourseRun.objects.count(), 2)
        self.assertEqual(CourseRunTranslation.objects.count(), 3)
        self.assertEqual(
            CourseRunTranslation.objects.filter(master=course_run).count(), 1
        )

        course_run.refresh_from_db()
        self.assertEqual(course_run.title, "mon titre")  # Fallback to french
        with switch_language(course_run, "fr"):
            self.assertEqual(course_run.title, "mon titre")

    # Mark course dirty

    def test_models_course_run_mark_dirty_any_field(self):
        """
        Updating the value of any editable field on the course run should mark the related
        course page dirty (waiting to be published).
        """

        fields = map(
            lambda f: f.name,
            filter(
                lambda f: f.editable
                and not f.auto_created
                and not f.name == "direct_course",
                CourseRun._meta.fields,
            ),
        )
        stub = CourseRunFactory(
            sync_mode="manual",
            catalog_visibility=CourseRunCatalogVisibility.COURSE_ONLY,
            offer=CourseRunOffer.SUBSCRIPTION,
            price=3.0,
            display_mode="compact",
        )  # New random values to update our course run

        for field in fields:
            course_run = CourseRunFactory()
            self.assertTrue(course_run.direct_course.extended_object.publish("en"))
            title_obj = course_run.direct_course.extended_object.title_set.first()

            setattr(course_run, field, getattr(stub, field))
            course_run.save()

            self.assertEqual(
                title_obj.publisher_state,
                PUBLISHER_STATE_DEFAULT,
                msg=f"Before refreshing from db {field:s}",
            )

            course_run.mark_course_dirty()
            title_obj.refresh_from_db()

            self.assertEqual(
                title_obj.publisher_state,
                PUBLISHER_STATE_DIRTY,
                msg=f"After refreshing from db {field:s}",
            )

    def test_models_course_run_mark_dirty_direct_course_field(self):
        """
        Changing the course to which a course run is related should mark both the source and the
        target course pages dirty (waiting to be published).
        """
        course_run = CourseRunFactory()
        course_source = course_run.direct_course
        course_target = CourseFactory(should_publish=True)
        self.assertTrue(course_source.extended_object.publish("en"))
        title_obj_source = course_source.extended_object.title_set.first()
        title_obj_target = course_target.extended_object.title_set.first()

        course_run.direct_course = course_target
        course_run.save()

        self.assertEqual(title_obj_source.publisher_state, PUBLISHER_STATE_DEFAULT)
        self.assertEqual(title_obj_target.publisher_state, PUBLISHER_STATE_DEFAULT)

        course_run.mark_course_dirty()
        title_obj_source.refresh_from_db()
        title_obj_target.refresh_from_db()

        self.assertEqual(title_obj_source.publisher_state, PUBLISHER_STATE_DIRTY)
        self.assertEqual(title_obj_target.publisher_state, PUBLISHER_STATE_DIRTY)

    def test_models_course_run_mark_dirty_parler(self):
        """
        Updating the value of a field translatable via parler should mark the related
        course page dirty (waiting to be published) only in the impacted language.
        """
        course = CourseFactory(page_languages=["en", "fr"])
        course_run = CourseRunFactory(direct_course=course)
        CourseRunTranslation.objects.create(
            master=course_run, language_code="fr", title="mon titre"
        )
        self.assertTrue(course_run.direct_course.extended_object.publish("en"))
        self.assertTrue(course_run.direct_course.extended_object.publish("fr"))
        course_run.refresh_from_db()
        self.assertIsNotNone(course_run.public_course_run)

        title_query = course_run.direct_course.extended_object.title_set
        title_obj_en = title_query.get(language="en")
        title_obj_fr = title_query.get(language="fr")
        self.assertEqual(title_query.count(), 2)

        with switch_language(course_run, "fr"):
            course_run.title = "nouveau titre"
        course_run.save()

        self.assertEqual(title_obj_en.publisher_state, PUBLISHER_STATE_DEFAULT)
        self.assertEqual(title_obj_fr.publisher_state, PUBLISHER_STATE_DEFAULT)

        course_run.mark_course_dirty()
        title_obj_en.refresh_from_db()
        title_obj_fr.refresh_from_db()

        self.assertEqual(title_obj_en.publisher_state, PUBLISHER_STATE_DEFAULT)
        self.assertEqual(title_obj_fr.publisher_state, PUBLISHER_STATE_DIRTY)

    def test_models_course_run_mark_dirty_update_to_be_scheduled_to(self):
        """
        Resetting a scheduled course run to a state "to be scheduled" should mark the related
        course page dirty.
        """
        course_run = CourseRunFactory()
        self.assertTrue(course_run.direct_course.extended_object.publish("en"))
        title_obj = course_run.direct_course.extended_object.title_set.first()

        course_run.start = None
        course_run.save()
        course_run.mark_course_dirty()
        title_obj.refresh_from_db()

        self.assertEqual(title_obj.publisher_state, PUBLISHER_STATE_DIRTY)

    def test_models_course_run_mark_dirty_update_to_be_scheduled_from(self):
        """
        Scheduling a course run that was to be scheduled should mark the related
        course page dirty.
        """
        now = django_timezone.now()
        course_run = CourseRunFactory(start=None, enrollment_start=now)
        self.assertTrue(course_run.direct_course.extended_object.publish("en"))
        title_obj = course_run.direct_course.extended_object.title_set.first()

        course_run.start = now
        course_run.save()
        course_run.mark_course_dirty()
        title_obj.refresh_from_db()

        self.assertEqual(title_obj.publisher_state, PUBLISHER_STATE_DIRTY)

    def test_models_course_run_mark_dirty_update_to_be_scheduled_remain(self):
        """
        Modifying a course run to be scheduled but keeping its state "to be scheduled" should
        not mark the related course page dirty.
        """
        course_run = CourseRunFactory(start=None)
        self.assertTrue(course_run.direct_course.extended_object.publish("en"))
        title_obj = course_run.direct_course.extended_object.title_set.first()

        course_run.end = django_timezone.now()
        course_run.save()
        course_run.mark_course_dirty()
        title_obj.refresh_from_db()

        self.assertEqual(title_obj.publisher_state, PUBLISHER_STATE_DEFAULT)

    def test_models_course_run_mark_dirty_create_course_run(self):
        """
        Creating a new course run in a scheduled state should mark the related course page dirty.
        """
        course = CourseFactory(should_publish=True)
        title_obj = course.extended_object.title_set.first()

        self.assertEqual(title_obj.publisher_state, PUBLISHER_STATE_DEFAULT)

        course_run = CourseRunFactory(direct_course=course)
        course_run.mark_course_dirty()
        title_obj.refresh_from_db()

        self.assertEqual(title_obj.publisher_state, PUBLISHER_STATE_DIRTY)

    def test_models_course_run_mark_dirty_create_course_run_to_be_scheduled(self):
        """
        Creating a new course run in a state "to be scheduled" should not mark the related
        course page dirty.
        """
        course = CourseFactory(should_publish=True)
        title_obj = course.extended_object.title_set.first()

        self.assertEqual(title_obj.publisher_state, PUBLISHER_STATE_DEFAULT)

        field = random.choice(["start", "enrollment_start"])
        course_run = CourseRunFactory(**{field: None})
        course_run.mark_course_dirty()
        title_obj.refresh_from_db()

        self.assertEqual(title_obj.publisher_state, PUBLISHER_STATE_DEFAULT)

    def test_models_course_run_mark_dirty_delete_course_run(self):
        """
        Deleting a scheduled course run should mark the related course page dirty.
        """
        course_run = CourseRunFactory()
        self.assertTrue(course_run.direct_course.extended_object.publish("en"))
        title_obj = course_run.direct_course.extended_object.title_set.first()
        course_run.refresh_from_db()

        self.assertEqual(title_obj.publisher_state, PUBLISHER_STATE_DEFAULT)

        course_run.delete()
        title_obj.refresh_from_db()

        self.assertEqual(title_obj.publisher_state, PUBLISHER_STATE_DIRTY)

    def test_models_course_run_mark_dirty_delete_course_run_to_be_scheduled(self):
        """
        Deleting a course run yet to be scheduled should not mark the related course page dirty.
        """
        field = random.choice(["start", "enrollment_start"])
        course_run = CourseRunFactory(**{field: None})
        self.assertTrue(course_run.direct_course.extended_object.publish("en"))
        title_obj = course_run.direct_course.extended_object.title_set.first()
        course_run.refresh_from_db()

        course_run.delete()
        title_obj.refresh_from_db()

        self.assertEqual(title_obj.publisher_state, PUBLISHER_STATE_DEFAULT)

    def test_models_course_run_delete_draft(self):
        """
        Deleting a draft course run that is not published should delete all its
        related translations.
        """
        course = CourseFactory(page_languages=["en", "fr"])
        course_run = CourseRunFactory(direct_course=course)
        CourseRunTranslation.objects.create(
            master=course_run, language_code="fr", title="mon titre"
        )

        self.assertEqual(CourseRun.objects.count(), 1)
        self.assertEqual(CourseRunTranslation.objects.count(), 2)

        course_run.delete()

        self.assertFalse(CourseRun.objects.exists())
        self.assertFalse(CourseRunTranslation.objects.exists())

    def test_models_course_run_delete_published_cascade(self):
        """
        Deleting a draft course run that is published should delete its public
        counterpart and all its translations by cascade.
        """
        course = CourseFactory(page_languages=["en", "fr"])
        course_run = CourseRunFactory(direct_course=course)
        CourseRunTranslation.objects.create(
            master=course_run, language_code="fr", title="mon titre"
        )
        self.assertTrue(course_run.direct_course.extended_object.publish("en"))
        self.assertTrue(course_run.direct_course.extended_object.publish("fr"))

        self.assertEqual(CourseRun.objects.count(), 2)
        self.assertEqual(CourseRunTranslation.objects.count(), 4)

        course_run.delete()

        self.assertFalse(CourseRun.objects.exists())
        self.assertFalse(CourseRunTranslation.objects.exists())

    def test_models_course_run_empty_translation_title(self):
        """
        A CourseRun translation object with an empty title should not raise any error
        when its '__str__' method is invoked.
        """
        course = CourseFactory(page_languages=["en", "fr"])
        course_run = CourseRunFactory(direct_course=course)
        french_run_translation = CourseRunTranslation.objects.create(
            master=course_run, language_code="fr", title=None
        )
        self.assertTrue(course_run.direct_course.extended_object.publish("en"))
        self.assertTrue(course_run.direct_course.extended_object.publish("fr"))

        self.assertEqual(
            str(french_run_translation), "Course Run Translation: Empty title"
        )

    def test_course_languages_all_languages_available_in_course_runs(self):
        """
        Test a course with multiple runs where each run has the same languages.
        It returns a 'str' with formed sentence.
        Sorting should be language specific.
        """
        course = CourseFactory(page_languages=["en", "fr"])
        CourseRunFactory.create_batch(
            5, direct_course=course, languages=["en", "fr", "de"]
        )

        course_languages = course.languages_display

        self.assertEqual(course_languages, "English, french and german")

    def test_course_languages_translation_specific_sorting(self):
        """Course languages display sorting should be language specific."""
        course = CourseFactory(page_languages=["en", "fr"])
        CourseRunFactory.create_batch(
            5, direct_course=course, languages=["en", "fr", "de"]
        )

        with translation.override("fr"):
            course_languages = course.languages_display

        self.assertEqual(course_languages, "Allemand, anglais et français")

    def test_course_languages_available_in_course_runs_more_languages(self):
        """
        Test course language presentation where each run has different languages.
        It returns a 'str' formed sentence with right sort.
        """
        course = CourseFactory(page_languages=["en", "fr"])
        CourseRunFactory.create(direct_course=course, languages=["en", "fr"])
        CourseRunFactory.create(direct_course=course, languages=["de", "it"])

        course_languages = course.languages_display

        self.assertEqual("English, french, german and italian", course_languages)

    def test_course_languages_all_languages_with_snapshot(self):
        """
        Languages of a snapshot should be taken into account to display all languages
        for a course.
        """
        course = CourseFactory(page_languages=["en", "fr"])
        CourseRunFactory.create_batch(5, direct_course=course, languages=["en", "fr"])
        snapshot = CourseFactory(
            page_parent=course.extended_object, should_publish=True
        )
        CourseRunFactory.create_batch(5, direct_course=snapshot, languages=["pt", "de"])

        course_languages = course.languages_display

        self.assertEqual(course_languages, "English, french, german and portuguese")

    def test_course_languages_not_show_hidden_course_runs(self):
        """
        A hidden course run should not be taken into account to display all languages
        for a course
        """
        course = CourseFactory(page_languages=["en", "fr"])
        CourseRunFactory.create_batch(5, direct_course=course, languages=["en", "fr"])
        CourseRunFactory.create_batch(
            2, direct_course=course, languages=["de", "it"], catalog_visibility="hidden"
        )

        course_languages = course.languages_display

        self.assertEqual(course_languages, "English and french")

    def test_course_languages_draft_vs_public(self):
        """
        The languages display of the draft and public course should be differentiated.
        """
        course = CourseFactory()
        course_run = CourseRunFactory(direct_course=course, languages=["en", "fr"])
        course.extended_object.publish("en")

        course_run.languages = ["de", "pt"]
        course_run.save()
        course.refresh_from_db()

        self.assertEqual(course.languages_display, "German and portuguese")
        self.assertEqual(
            course.public_extension.languages_display, "English and french"
        )
