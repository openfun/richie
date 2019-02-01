"""
Declare and configure the models for the courses application
"""
from collections import namedtuple

from django import forms
from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils import timezone, translation
from django.utils.functional import lazy
from django.utils.translation import ugettext_lazy as _

from cms.api import Page
from cms.extensions.extension_pool import extension_pool
from cms.models.pluginmodel import CMSPlugin
from filer.fields.image import FilerImageField

from ...core.models import BasePageExtension, PagePluginMixin
from .category import Category
from .organization import Organization

CourseState = namedtuple("CourseState", ["priority", "cta", "text", "datetime"])


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

        The game is to find, in the correct order, the first of the following conditions that is
        verified for this course:
          0: a run is on-going and open for enrollment > "closing on": {enrollment_end}
          1: a run is future and open for enrollment > "starting on": {start}
          2: a run is future and not yet open for enrollment > "starting on": {start}
          3: a run is future and no more open for enrollment > "closed": {None}
          4: a run is on-going but closed for enrollment > "on going": {None}
          5: there's a finished run in the past > "archived": {None}
          6: there are no runs at all > "coming soon": {None}
        """
        # The default state is for a course that has no course runs
        best_state = CourseState(6, None, _("coming soon"), None)

        for course_run in self.get_course_runs_for_language().only(
            "start", "end", "enrollment_start", "enrollment_end"
        ):
            state = course_run.state
            if state.priority < best_state.priority:
                best_state = state
            if state.priority == 0:
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
    languages = ChoiceArrayField(
        # Language choices are made lazy so that we can override them in our tests.
        # When set directly, they are evaluated too early and can't be changed with the
        # "override_settings" utility.
        models.CharField(
            max_length=10, choices=lazy(lambda: settings.ALL_LANGUAGES, tuple)()
        ),
        help_text=_("The languages in which the course content is available."),
    )

    TEMPLATE_DETAIL = "courses/cms/course_run_detail.html"

    class Meta:
        verbose_name = _("course run")

    def __str__(self):
        """Human representation of a course run."""
        start = "{:%y/%m/%d %H:%M} - ".format(self.start) if self.start else ""
        return "{start:s}{course:s}".format(
            course=self.extended_object.get_title(), start=start
        )

    # pylint: disable=unused-argument
    def get_languages_display(self, *args):
        """
        We are using the "languages" ArrayField with a field that has choices. In order to display
        human readable value of these multiple choices, we need to write our own method because
        the ArrayField does not support it yet.

        Parameters:
        -----------
        args: we add this because we use this method in a "render_model" template tag and it
            passes a "request" argument when calling the method. For more information, see:
            http://docs.django-cms.org/en/latest/how_to/frontend_models.html#special-attributes

        Returns:
        --------
        string: comma separated list of human readable languages.
        """
        result = ""
        for i, language in enumerate(self.languages):
            if i == 0:
                result = str(settings.ALL_LANGUAGES_DICT[language])
            else:
                result = "{:s}, {!s}".format(
                    result, settings.ALL_LANGUAGES_DICT[language]
                )
        return result

    # pylint: disable=arguments-differ
    def save(self, *args, **kwargs):
        """
        Enforce validation each time an instance is saved.
        """
        self.full_clean()
        super().save(*args, **kwargs)

    @staticmethod
    def compute_state(start, end, enrollment_start, enrollment_end):
        """
        Compute at the current time the state of a course run that would have the dates
        passed in argument.

        A static method not using the instance allows to call it with an Elasticsearch result.

        Several states are possible for a course run each of which is given a priority. The
        lower the priority, the more interesting the course run is (a course run open for
        enrollment is more interesting than an archived course run):
          0: a run is on-going and open for enrollment > "closing on": {enrollment_end}
          1: a run is future and open for enrollment > "starting on": {start}
          2: a run is future and not yet open for enrollment > "starting on": {start}
          3: a run is future and no more open for enrollment > "closed": {None}
          4: a run is on-going but closed for enrollment > "on going": {None}
          5: there's a finished run in the past > "archived": {None}
          6: there are no runs at all > "coming soon": {None}
        """
        now = timezone.now()
        if start < now:
            if end > now:
                if enrollment_end > now:
                    # ongoing open
                    return CourseState(
                        0, _("enroll now"), _("closing on"), enrollment_end
                    )
                # ongoing closed
                return CourseState(4, None, _("on-going"), None)
            # archived
            return CourseState(5, None, _("archived"), None)
        if enrollment_start > now:
            # future not yet open
            return CourseState(2, _("see details"), _("starting on"), start)
        if enrollment_end > now:
            # future open
            return CourseState(1, _("enroll now"), _("starting on"), start)
        # future already closed
        return CourseState(3, None, _("enrollment closed"), None)

    @property
    def state(self):
        """Return the state of the course run at the current time."""
        return self.compute_state(
            self.start, self.end, self.enrollment_start, self.enrollment_end
        )


class CoursePluginModel(PagePluginMixin, CMSPlugin):
    """
    Course plugin model handles the relation from CoursePlugin
    to their Course instance
    """

    page = models.ForeignKey(
        Page,
        related_name="course_plugins",
        limit_choices_to={
            # There's a draft and a public course attached to the draft and
            # the public parent. Without the first condition, 4 options are
            # availables for each course. The second condition makes sure the
            # parent is not a course. The third option filters out public
            # course. The fourth option makes sure only courses show up.
            # If there's is no parent, the course is filtered out.
            "node__parent__cms_pages__publisher_is_draft": True,
            "node__parent__cms_pages__course__isnull": True,
            "publisher_is_draft": True,
            "course__isnull": False,
        },
    )

    class Meta:
        verbose_name = _("course plugin model")

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
    logo = FilerImageField(verbose_name=_("logo"), related_name="licence")
    url = models.CharField(_("url"), blank=True, max_length=255)
    content = models.TextField(_("content"), blank=False, default="")

    class Meta:
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

    licence = models.ForeignKey(Licence)
    description = models.TextField(_("description"), blank=True, default="")

    def __str__(self):
        """Human representation of a person plugin"""
        return "{model:s}: {name:s}".format(
            model=self._meta.verbose_name.title(), name=self.licence.name
        )


extension_pool.register(Course)
extension_pool.register(CourseRun)
