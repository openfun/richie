"""
Declare and configure the models for the courses application
"""
from collections.abc import Mapping
from datetime import MAXYEAR, datetime

from django import forms
from django.contrib.postgres.fields import ArrayField
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils import timezone, translation
from django.utils.functional import lazy
from django.utils.translation import ugettext_lazy as _

import pytz
from cms.api import Page
from cms.extensions.extension_pool import extension_pool
from cms.models.pluginmodel import CMSPlugin
from filer.fields.image import FilerImageField

from ...core.defaults import ALL_LANGUAGES
from ...core.fields.multiselect import MultiSelectField
from ...core.models import BasePageExtension, PagePluginMixin
from .category import Category
from .organization import Organization

MAX_DATE = datetime(MAXYEAR, 12, 31, tzinfo=pytz.utc)


class CourseState(Mapping):
    """An immutable object to describe a course (resp. course run) state."""

    STATE_CALLS_TO_ACTION = (
        _("enroll now"),
        _("enroll now"),
        _("see details"),
        None,
        None,
        None,
        None,
    )

    STATE_TEXTS = (
        _("closing on"),
        _("starting on"),
        _("starting on"),
        _("enrollment closed"),
        _("on-going"),
        _("archived"),
        _("to be scheduled"),
    )

    def __init__(self, priority, date_time=None):
        """
        Initialize a course state with a priority and optionally a datetime.

        Several states are possible for a course run each of which is given a priority. The
        lower the priority, the more interesting the course run is (a course run open for
        enrollment is more interesting than an archived course run):
          0: a run is on-going and open for enrollment > "closing on": {enrollment_end}
          1: a run is future and open for enrollment > "starting on": {start}
          2: a run is future and not yet open for enrollment > "starting on": {start}
          3: a run is future and no more open for enrollment > "closed": {None}
          4: a run is on-going but closed for enrollment > "on going": {None}
          5: there's a finished run in the past > "archived": {None}
          6: theres's no run with a start date or no run at all > "to be scheduled": {None}
        """
        # Check that `date_time` is set when it should be
        if date_time is None and priority in [0, 1, 2]:
            raise ValidationError(
                "date_time should not be null for a {:d} course state.".format(priority)
            )

        # A special case of being open is when enrollment never ends
        text = self.STATE_TEXTS[priority]
        if priority == 0 and date_time.year == MAXYEAR:
            text = _("forever open")
            date_time = None
        kwargs = {
            "priority": priority,
            "datetime": date_time,
            "call_to_action": self.STATE_CALLS_TO_ACTION[priority],
            "text": text,
        }
        self._d = dict(**kwargs)

    def __iter__(self):
        """Iterate on the inner dictionary."""
        return iter(self._d)

    def __len__(self):
        """Return length of the inner dictionary."""
        return len(self._d)

    def __getitem__(self, key):
        """Access the inner dictionary."""
        return self._d[key]

    def __lt__(self, other):
        """Make it easy to compare two course states."""
        return self._d["priority"] < other["priority"]


class ChoiceArrayField(ArrayField):
    """
    A field that allows us to store an array of choices.
    Uses Django's Postgres ArrayField
    and a MultipleChoiceField for its formfield.
    """

    def formfield(self, **kwargs):
        defaults = {
            "form_class": forms.MultipleChoiceField,
            "choices": self.base_field.choices,
        }
        defaults.update(kwargs)
        # Skip our parent's formfield implementation completely as we don't
        # care for it.
        # pylint:disable=bad-super-call
        return super(ArrayField, self).formfield(**defaults)


class Course(BasePageExtension):
    """
    The course page extension represents and records a course in the catalog.

    This model should be used to record structured data about the course whereas the
    associated page object is where we record the less structured information to display on the
    page that presents the course.
    """

    ROOT_REVERSE_ID = "courses"
    TEMPLATE_DETAIL = "courses/cms/course_detail.html"

    class Meta:
        db_table = "richie_course"
        verbose_name = _("course")

    def __str__(self):
        """Human representation of a course."""
        return "{model}: {title}".format(
            model=self._meta.verbose_name.title(),
            title=self.extended_object.get_title(),
        )

    def get_organizations(self):
        """
        Return the organizations linked to the course via an organization plugin in the
        placeholder `course_organizations` on the course detail page, ranked by their
        `position`.
        """
        selector = "extended_object__organization_plugins__cmsplugin_ptr__placeholder"
        # pylint: disable=no-member
        filter_dict = {
            "{:s}__page".format(selector): self.extended_object,
            "{:s}__slot".format(selector): "course_organizations",
        }
        # For a public course, we must filter out organizations that are not published in
        # any language
        if self.extended_object.publisher_is_draft is False:
            filter_dict["extended_object__title_set__published"] = True

        return (
            Organization.objects.filter(**filter_dict)
            .select_related("extended_object")
            .order_by("extended_object__organization_plugins__cmsplugin_ptr__position")
            .distinct()
        )

    def get_main_organization(self):
        """
        Return the main organization linked to the course via an organization plugin in the
        placeholder `course_organizations` on the course detail page.

        Plugins are sortable by drag-and-drop in the plugin bar so we use this "position"
        information to return the first one as the main organization.
        """
        return self.get_organizations().first()

    def get_categories(self):
        """
        Return the categories linked to the course via a category plugin in the placeholder
        `course_categories` on the course detail page, ranked by their `position`.
        """
        selector = "extended_object__category_plugins__cmsplugin_ptr__placeholder"
        # pylint: disable=no-member
        filter_dict = {
            "{:s}__page".format(selector): self.extended_object,
            "{:s}__slot".format(selector): "course_categories",
        }
        # For a public course, we must filter out categories that are not published in
        # any language
        if self.extended_object.publisher_is_draft is False:
            filter_dict["extended_object__title_set__published"] = True

        return (
            Category.objects.filter(**filter_dict)
            .select_related("extended_object")
            .order_by("extended_object__category_plugins__cmsplugin_ptr__position")
            .distinct()
        )

    def get_root_to_leaf_category_pages(self):
        """
        Build a query retrieving all pages linked to the category or one of its ancestors,
        excluding the meta category itself.

        This is useful to build the course Elasticsearch index. When category is linked to a
        course, we associate all its ancestors (excluding the meta category) to the course so
        that a search for courses in an ancestor category also returns the course.
        """
        category_query = self.get_categories()

        # 1. We want the pages directly related to a category of the course
        page_query = Page.objects.filter(publisher_draft__category__in=category_query)
        # 2. We want the pages related to one of the ancestors of the categories of the course
        for category in category_query.select_related(
            "public_extension__extended_object"
        ):
            ancestor_query = (
                category.public_extension.extended_object.get_ancestor_pages()
            )
            # Don't include the meta category as it materializes a "filter bank" and not a
            # search option
            page_query = page_query | ancestor_query.filter(
                node__parent__cms_pages__category__isnull=False
            )
        return page_query.distinct()

    def get_course_runs(self):
        """
        Returns a query yielding the course runs related to the course. They may be direct
        children of the course or children of a snapshot of the course.

        For a draft course instance, the related draft course runs are retrieved.
        For a public course instance, the related public course runs are retrieved, but only
        those that are currently published in at least one language*.

        (*) The catch here is that a course run could have been published and then unpublished
            for all languages. The public instance is created the first time a draft page is
            published. Of course, this public instance will still exist if the object is then
            unpublished for all languages...
            Said differently, a page can have a public version of itself in database but not be
            currently published in any language.
        """
        node = self.extended_object.node
        is_draft = self.extended_object.publisher_is_draft
        filter_dict = {
            "extended_object__publisher_is_draft": is_draft,
            "extended_object__node__path__startswith": node.path,
            "extended_object__node__depth__gt": node.depth,
        }
        # For a public course, we must filter out course runs that are not published in
        # any language
        if is_draft is False:
            filter_dict["extended_object__title_set__published"] = True

        return (
            CourseRun.objects.filter(**filter_dict)
            .order_by("extended_object__node__path")
            .distinct()
        )

    def get_course_runs_for_language(self, language=None):
        """
        Returns a query yielding the course runs related to the course for the current
        language (or the language passed in arguments). They may be direct children of
        the course or children of a snapshot of the course.
        """
        language = language or translation.get_language()
        course_runs = self.get_course_runs()

        # For a public course, we must filter out course runs that are not published in
        # the language
        if self.extended_object.publisher_is_draft is False:
            course_runs = course_runs.filter(
                extended_object__title_set__language=language,
                extended_object__title_set__published=True,
            )
        else:
            course_runs = course_runs.filter(
                extended_object__title_set__language=language
            )

        return course_runs

    @property
    def state(self):
        """
        The state of the course carrying information on what to display on a course glimpse.

        The game is to find the highest priority state for this course among its course runs.
        """
        # The default state is for a course that has no course runs
        best_state = CourseState(6)

        for course_run in self.get_course_runs_for_language().only(
            "start", "end", "enrollment_start", "enrollment_end"
        ):
            state = course_run.state
            if state < best_state:
                best_state = state
            if state == 0:
                # We found the best state, don't waste more time
                break

        return best_state

    def save(self, *args, **kwargs):
        """
        Enforce validation each time an instance is saved
        """
        self.full_clean()
        super().save(*args, **kwargs)


class CourseRun(BasePageExtension):
    """
    The course run represents and records the occurence of a course between a start
    and an end date.
    """

    resource_link = models.URLField(_("Resource link"), blank=True, null=True)
    start = models.DateTimeField(_("course start"), blank=True, null=True)
    end = models.DateTimeField(_("course end"), blank=True, null=True)
    enrollment_start = models.DateTimeField(
        _("enrollment start"), blank=True, null=True
    )
    enrollment_end = models.DateTimeField(_("enrollment end"), blank=True, null=True)
    languages = MultiSelectField(
        max_choices=50,
        max_length=255,  # MySQL does not allow max_length > 255
        # Language choices are made lazy so that we can override them in our tests.
        # When set directly, they are evaluated too early and can't be changed with the
        # "override_settings" utility.
        choices=lazy(lambda: ALL_LANGUAGES, tuple)(),
        help_text=_("The list of languages in which the course content is available."),
    )

    TEMPLATE_DETAIL = "courses/cms/course_run_detail.html"

    class Meta:
        db_table = "richie_course_run"
        verbose_name = _("course run")

    def __str__(self):
        """Human representation of a course run."""
        start = "{:%y/%m/%d %H:%M} - ".format(self.start) if self.start else ""
        return "{start:s}{course:s}".format(
            course=self.extended_object.get_title(), start=start
        )

    # pylint: disable=arguments-differ
    def save(self, *args, **kwargs):
        """
        Enforce validation each time an instance is saved.
        """
        self.full_clean()
        super().save(*args, **kwargs)

    # pylint: disable=too-many-return-statements
    @staticmethod
    def compute_state(start, end, enrollment_start, enrollment_end):
        """
        Compute at the current time the state of a course run that would have the dates
        passed in argument.

        A static method not using the instance allows to call it with an Elasticsearch result.
        """
        if not start or not enrollment_start:
            return CourseState(6)

        # course run end dates are not required and should default to forever
        # e.g. a course run with no end date is presumed to be always on-going
        end = end or MAX_DATE
        enrollment_end = enrollment_end or end

        now = timezone.now()
        if start < now:
            if end > now:
                if enrollment_end > now:
                    # ongoing open
                    return CourseState(0, enrollment_end)
                # ongoing closed
                return CourseState(4)
            # archived
            return CourseState(5)
        if enrollment_start > now:
            # future not yet open
            return CourseState(2, start)
        if enrollment_end > now:
            # future open
            return CourseState(1, start)
        # future already closed
        return CourseState(3)

    @property
    def state(self):
        """Return the state of the course run at the current time."""
        return self.compute_state(
            self.start, self.end, self.enrollment_start, self.enrollment_end
        )

    def get_course(self):
        """Get the course for this course run."""
        nodes = self.extended_object.node.get_ancestors()
        return Course.objects.get(
            # Joining on `cms_pages` generate duplicates for courses that are under a parent page
            # when this page exists both in draft and public versions. We need to exclude the
            # parent public page to avoid this duplication
            Q(
                extended_object__node__parent__cms_pages__publisher_is_draft=True
            )  # course has a parent
            | Q(extended_object__node__parent__isnull=True),  # course has no parent
            # Target courses that are ancestors of the course run
            extended_object__node__in=nodes,
            # Exclude snapshots
            extended_object__node__parent__cms_pages__course__isnull=True,  # exclude snapshots
            # Get the course in the same version as the course run
            extended_object__publisher_is_draft=self.extended_object.publisher_is_draft,
        )


class CoursePluginModel(PagePluginMixin, CMSPlugin):
    """
    Course plugin model handles the relation from CoursePlugin
    to their Course instance
    """

    page = models.ForeignKey(
        Page,
        on_delete=models.CASCADE,
        related_name="course_plugins",
        limit_choices_to={
            # Joining on `cms_pages` generate duplicates for courses that are under a parent page
            # when this page exists both in draft and public versions. We need to exclude the
            # parent public page to avoid this duplication with the first condition.
            # The second condition makes sure the parent is not a course to exclude snapshots.
            # The third condition filters out public course.
            # The fourth condition makes sure only courses show up.
            "node__parent__cms_pages__publisher_is_draft": True,  # exclude course published parent
            "node__parent__cms_pages__course__isnull": True,  # limit to course - no snapshot
            "publisher_is_draft": True,  # plugins work with draft instances
            "course__isnull": False,  # limit to pages linked to a course object
        },
    )

    class Meta:
        db_table = "richie_course_plugin"
        verbose_name = _("course plugin")

    def __str__(self):
        """Human representation of a page plugin"""
        return "{model:s}: {id:d}".format(
            model=self._meta.verbose_name.title(), id=self.id
        )


class Licence(models.Model):
    """
    Licence model.

    Instances of this models should only be created by administrators.
    """

    name = models.CharField(_("name"), max_length=200)
    logo = FilerImageField(
        verbose_name=_("logo"), on_delete=models.PROTECT, related_name="licence"
    )
    url = models.CharField(_("url"), blank=True, max_length=255)
    content = models.TextField(_("content"), blank=False, default="")

    class Meta:
        db_table = "richie_licence"
        verbose_name = _("licence")

    def __str__(self):
        """Human representation of a person title"""
        return "{model}: {name}".format(
            model=self._meta.verbose_name.title(), name=self.name
        )


class LicencePluginModel(CMSPlugin):
    """
    Licence plugin model.
    """

    licence = models.ForeignKey(Licence, on_delete=models.CASCADE)
    description = models.TextField(_("description"), blank=True, default="")

    class Meta:
        db_table = "richie_licence_plugin"
        verbose_name = _("licence plugin")

    def __str__(self):
        """Human representation of a person plugin"""
        return "{model:s}: {name:s}".format(
            model=self._meta.verbose_name.title(), name=self.licence.name
        )


extension_pool.register(Course)
extension_pool.register(CourseRun)
