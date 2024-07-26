"""
Declare and configure the models for the courses application
"""

# pylint: disable=too-many-lines
from collections.abc import Mapping
from datetime import MAXYEAR, datetime, timezone

from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import models
from django.db.models import Q, Sum
from django.urls import reverse
from django.utils import timezone as django_timezone
from django.utils.functional import cached_property, lazy
from django.utils.translation import gettext_lazy as _

from cms.constants import PUBLISHER_STATE_DIRTY
from cms.extensions.extension_pool import extension_pool
from cms.models import Page, PagePermission
from cms.models.pluginmodel import CMSPlugin
from filer.fields.image import FilerImageField
from filer.models import FolderPermission
from parler.models import TranslatableModel, TranslatedField, TranslatedFieldsModel

from ...core.defaults import ALL_LANGUAGES
from ...core.fields.duration import CompositeDurationField
from ...core.fields.multiselect import MultiSelectField
from ...core.helpers import get_permissions
from ...core.models import BasePageExtension, EsIdMixin
from .. import defaults, utils
from .category import Category, CategoryPluginModel
from .organization import Organization, OrganizationPluginModel
from .person import Person, PersonPluginModel
from .role import PageRole

MAX_DATE = datetime(MAXYEAR, 12, 31, tzinfo=timezone.utc)


class CourseState(Mapping):
    """An immutable object to describe a course (resp. course run) state."""

    (
        ONGOING_OPEN,
        FUTURE_OPEN,
        ARCHIVED_OPEN,
        FUTURE_NOT_YET_OPEN,
        FUTURE_CLOSED,
        ONGOING_CLOSED,
        ARCHIVED_CLOSED,
        TO_BE_SCHEDULED,
    ) = range(8)

    STATE_CALLS_TO_ACTION = {
        ONGOING_OPEN: _("enroll now"),
        FUTURE_OPEN: _("enroll now"),
        ARCHIVED_OPEN: _("study now"),
        FUTURE_NOT_YET_OPEN: None,
        FUTURE_CLOSED: None,
        ONGOING_CLOSED: None,
        ARCHIVED_CLOSED: None,
        TO_BE_SCHEDULED: None,
    }

    STATE_TEXTS = {
        ONGOING_OPEN: _("open for enrollment"),
        FUTURE_OPEN: _("starting on"),
        ARCHIVED_OPEN: _("closing on"),
        FUTURE_NOT_YET_OPEN: _("starting on"),
        FUTURE_CLOSED: _("enrollment closed"),
        ONGOING_CLOSED: _("on-going"),
        ARCHIVED_CLOSED: _("archived"),
        TO_BE_SCHEDULED: _("to be scheduled"),
    }

    def __init__(self, priority, date_time=None):
        """
        Initialize a course state with a priority and optionally a datetime.

        Several states are possible for a course run each of which is given a priority. The
        lower the priority, the more interesting the course run is (a course run open for
        enrollment is more interesting than an archived course run):
        - ONGOING_OPEN: a run is on-going and open for enrollment > "closing on": {enrollment_end}
        - FUTURE_OPEN: a run is future and open for enrollment > "starting on": {start}
        - ARCHIVED_OPEN: a run is past but open for enrollment > "closing on": {enrollment_end}
        - FUTURE_NOT_YET_OPEN: a run is future and not yet open for enrollment
            > "starting on": {start}
        - FUTURE_CLOSED: a run is future and no more open for enrollment > "closed": {None}
        - ONGOING_CLOSED: a run is on-going but closed for enrollment > "on going": {None}
        - ARCHIVED_CLOSED: there's a finished run in the past > "archived": {None}
        - TO_BE_SCHEDULED: theres's no run with a start date or no run at all
            > "to be scheduled": {None}
        """
        # Check that `date_time` is set when it should be
        if date_time is None and priority in [
            CourseState.ONGOING_OPEN,
            CourseState.FUTURE_OPEN,
            CourseState.ARCHIVED_OPEN,
            CourseState.FUTURE_NOT_YET_OPEN,
        ]:
            raise ValidationError(
                f"date_time should not be null for a {priority:d} course state."
            )

        # A special case of being open is when enrollment never ends
        text = self.STATE_TEXTS[priority]
        if (
            priority in [CourseState.ONGOING_OPEN, CourseState.ARCHIVED_OPEN]
            and date_time.year == MAXYEAR
        ):
            text = _("forever open")
            date_time = None
        elif priority == CourseState.ONGOING_OPEN:
            date_time = None

        kwargs = {
            "priority": priority,
            "datetime": date_time,
            "call_to_action": self.STATE_CALLS_TO_ACTION[priority],
            "text": text,
        }

        self._d = {**kwargs}

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


# pylint: disable=too-many-public-methods
class Course(EsIdMixin, BasePageExtension):
    """
    The course page extension represents and records a course in the catalog.

    This model should be used to record structured data about the course whereas the
    associated page object is where we record the less structured information to display on the
    page that presents the course.
    """

    CODE_MAX_LENGTH = 100

    code = models.CharField(
        _("code"),
        max_length=CODE_MAX_LENGTH,
        help_text=_("Unique reference for the course."),
        null=True,
        blank=True,
    )

    duration = CompositeDurationField(
        time_units=defaults.TIME_UNITS,
        default_unit=defaults.DEFAULT_TIME_UNIT,
        max_length=80,
        blank=True,
        null=True,
        help_text=_("The course time range."),
    )

    effort = CompositeDurationField(
        time_units=defaults.EFFORT_UNITS,
        default_unit=defaults.DEFAULT_EFFORT_UNIT,
        max_length=80,
        blank=True,
        null=True,
        help_text=_("Total amount of time to complete this course."),
    )

    is_listed = models.BooleanField(
        default=True,
        verbose_name=_("is listed"),
        help_text=_("Tick if you want the course to be visible on the search page."),
    )

    is_self_paced = models.BooleanField(
        default=False,
        verbose_name=_("is self paced"),
        help_text=_("Tick if the course pace is self paced."),
    )

    PAGE = defaults.COURSES_PAGE

    class Meta:
        db_table = "richie_course"
        verbose_name = _("course")
        verbose_name_plural = _("courses")

    def __str__(self):
        """Human representation of a course."""
        model = self._meta.verbose_name.title()
        title = self.extended_object.get_title()
        return f"{model:s}: {title:s}"

    def clean(self):
        """
        We normalize the code with slugify for better uniqueness
        """
        # Normalize the code by slugifying and capitalizing it
        self.code = utils.normalize_code(self.code)
        return super().clean()

    @property
    def pt_effort(self):
        """Return effort as a PT string for schema.org metadata."""
        if not self.effort:
            return ""

        (effort, effort_unit) = self.effort
        unit_letter = effort_unit[0].upper()
        return f"PT{effort:d}{unit_letter:s}"

    def validate_unique(self, exclude=None):
        """
        We can't enforce code unicity with a db constraint because it is repeated across
        the draft and public versions of the page AND in each snapshot of a course.

        A complex unique constraint would have to span the "extended_object" public key
        which is not possible.
        """
        super().validate_unique()

        if self.code and not self.is_snapshot:
            # Check unicity for the version being saved (draft or published)
            is_draft = self.extended_object.publisher_is_draft
            uniqueness_query = self.__class__.objects.filter(
                code=self.code,
                extended_object__publisher_is_draft=is_draft,
                # allow snapshot duplicates
                extended_object__node__parent__cms_pages__course__isnull=True,
            )

            # If the page is being updated, we should exclude it while looking for duplicates
            if self.pk:
                uniqueness_query = uniqueness_query.exclude(pk=self.pk)

            # Raise a ValidationError if the code already exists
            if uniqueness_query.exists():
                raise ValidationError(
                    {"code": ["A course already exists with this code."]}
                )

    def get_admin_url_to_add_run(self, request):
        """
        Get the admin url of the form to add a course run with the "direct_course"
        field pre-populated to self.
        """
        base_url = reverse("admin:courses_courserun_add")
        return f"{base_url:s}?direct_course={self.id:d}"

    @property
    def is_snapshot(self):
        """Return True if the course is a snapshot (it has a course as parent)."""
        # Look for the page and not the course as the course may not yet be created in database
        # (see "validate_unique" method below)
        return Page.objects.filter(
            id=self.extended_object.id, node__parent__cms_pages__course__isnull=False
        ).exists()

    def create_page_role(self):
        """
        Create a new page role for the course with:
          - a user group to handle permissions for admins of this course,
          - a folder in Django Filer to store images related to this course,
          - all necessary permissions.
        """
        if not getattr(settings, "CMS_PERMISSION", False):
            return None

        # The page role is only created for draft courses
        if not self.extended_object.publisher_is_draft:
            return None

        # Don't do anything if it already exists
        page_role = PageRole.objects.filter(
            page=self.extended_object, role=defaults.ADMIN
        ).first()

        if page_role:
            return page_role

        # Create a role for admins of this course (which will automatically create a new
        # user group and a new Filer folder)
        page_role = PageRole.objects.create(
            page=self.extended_object, role=defaults.ADMIN
        )

        # Associate permissions as defined in settings:
        # - Create Django permissions
        page_role.group.permissions.set(
            get_permissions(defaults.COURSE_ADMIN_ROLE.get("django_permissions", []))
        )

        # - Create DjangoCMS page permissions
        PagePermission.objects.create(
            group_id=page_role.group_id,
            page=self.extended_object,
            **defaults.COURSE_ADMIN_ROLE.get("course_page_permissions", {}),
        )

        # - Create the Django Filer folder permissions
        FolderPermission.objects.create(
            folder_id=page_role.folder_id,
            group_id=page_role.group_id,
            **defaults.COURSE_ADMIN_ROLE.get("course_folder_permissions", {}),
        )
        return page_role

    def create_permissions_for_organization(self, organization):
        """
        Create page and folder permissions on the course page for the admin group of the
        organization passed in argument.
        """
        course_page_role = self.create_page_role()
        organization_page_role = organization.create_page_role()

        if organization_page_role is None or course_page_role is None:
            return

        # - Create DjangoCMS page permissions
        PagePermission.objects.get_or_create(
            group_id=organization_page_role.group_id,
            page_id=self.extended_object_id,
            defaults=defaults.ORGANIZATION_ADMIN_ROLE.get(
                "courses_page_permissions", {}
            ),
        )

        # - Create the Django Filer folder permissions
        FolderPermission.objects.get_or_create(
            group_id=organization_page_role.group_id,
            folder_id=course_page_role.folder_id,
            defaults=defaults.ORGANIZATION_ADMIN_ROLE.get(
                "courses_folder_permissions", {}
            ),
        )

    def get_organizations(self, language=None):
        """
        Return the organizations linked to the course via an organization plugin in any
        of the placeholders on the course detail page, ranked by their `path` to respect
        the order in the organizations tree.
        """
        return self.get_direct_related_page_extensions(
            Organization, OrganizationPluginModel, language=language
        )

    def get_main_organization(self):
        """
        Return the main organization linked to the course via an organization plugin on the
        course detail page.

        Plugins are sortable by drag-and-drop in the plugin bar so we use this "position"
        information to return the first one as the main organization. We assume that only one
        placeholder holds organization plugins and return the first organization in order of
        position in this placeholder.
        """
        return (
            self.get_organizations()
            .order_by("extended_object__organization_plugins__cmsplugin_ptr__position")
            .first()
        )

    def get_persons(self, language=None):
        """
        Return the persons linked to the course via a person plugin in any of the
        placeholders on the course detail page, ranked by their `path` to respect
        the order in the persons tree.
        """
        return self.get_direct_related_page_extensions(
            Person, PersonPluginModel, language=language
        )

    def get_categories(self, language=None):
        """
        Return the categories linked to the course via a category plugin in any of the
        placeholders on the course detail page, ranked by their `path` to respect the
        order in the categories tree.
        """
        return self.get_direct_related_page_extensions(
            Category, CategoryPluginModel, language=language
        )

    def get_root_to_leaf_public_category_pages(self):
        """
        Build a query retrieving all pages linked to this course's categories or one of their
        ancestors excluding the meta category itself.

        This is useful to build the course Elasticsearch index. When a category is linked to a
        course, we associate all its ancestors (excluding the meta category) to the course so
        that a search for courses in an ancestor category also returns the course.
        """
        category_query = self.get_categories()

        # 1. We want the pages directly related to a category of the course
        page_query = Page.objects.filter(
            publisher_draft__category__in=category_query, title_set__published=True
        )
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
                node__parent__cms_pages__category__isnull=False,
                title_set__published=True,
            )
        return page_query.distinct()

    def get_snapshots(self, include_self=False):
        """
        Get a query yielding all snapshots of a course.

        Arguments:
        ----------
        include_self (boolean): whether the current object should be included in the query
            or just its snapshots.

        Returns:
        --------
        Queryset[Course]: All snapshots of a course (calling this method on a snapshot would
            return an empty queryset)

        """
        is_draft = self.extended_object.publisher_is_draft
        node = self.extended_object.node
        current_and_descendant_nodes = node.__class__.get_tree(parent=node)

        query = self.__class__.objects.filter(
            extended_object__node__in=current_and_descendant_nodes,
            extended_object__publisher_is_draft=is_draft,
        )

        if include_self is False:
            query = query.exclude(pk=self.pk)

        return query

    @cached_property
    def course_runs(self):
        """
        Returns a query yielding the course runs related to the course. They may be directly
        related to the course or to a snapshot of the course.

        The draft and the public page have their own course runs. The course runs on the draft
        page are copied to the public page when the course is published (for any language).
        """
        is_draft = self.extended_object.publisher_is_draft
        node = self.extended_object.node
        current_and_descendant_nodes = node.__class__.get_tree(parent=node)

        return CourseRun.objects.filter(
            direct_course__extended_object__node__in=current_and_descendant_nodes,
            direct_course__extended_object__publisher_is_draft=is_draft,
        ).order_by("-start")

    @cached_property
    def course_runs_enrollment_count(self):
        """
        Returns a query that sum the enrollment count of each course run. They may be directly
        related to the course or to a snapshot of the course.

        The draft and the public page have their own course runs. The course runs on the draft
        page are copied to the public page when the course is published (for any language).
        """
        is_draft = self.extended_object.publisher_is_draft
        node = self.extended_object.node
        current_and_descendant_nodes = node.__class__.get_tree(parent=node)

        return (
            CourseRun.objects.filter(
                direct_course__extended_object__node__in=current_and_descendant_nodes,
                direct_course__extended_object__publisher_is_draft=is_draft,
            )
            .exclude(catalog_visibility=CourseRunCatalogVisibility.HIDDEN)
            .aggregate(sum=Sum("enrollment_count"))["sum"]
        )

    @cached_property
    def languages_display(self):
        """
        Returns a string listing languages available for this course across all its
        course runs (merged).
        Languages related to the course's snapshots should not be taken into account.

        The draft and the public page have their own course runs. The course runs on the draft
        page are copied to the public page when the course is published (for any language).
        """
        is_draft = self.extended_object.publisher_is_draft
        node = self.extended_object.node
        current_and_descendant_nodes = node.__class__.get_tree(parent=node)

        course_runs = (
            CourseRun.objects.filter(
                direct_course__extended_object__node__in=current_and_descendant_nodes,
                direct_course__extended_object__publisher_is_draft=is_draft,
            )
            .exclude(catalog_visibility="hidden")
            .only("languages")
        )
        languages = list(
            {x for course_languages in course_runs for x in course_languages.languages}
        )
        instance = CourseRun(languages=languages)
        return instance.get_languages_display()

    @property
    def course_runs_dict(self):
        """Returns a dict of course runs grouped by their state."""
        course_runs_dict = {
            i: [] for i in range(len(CourseState.STATE_CALLS_TO_ACTION))
        }
        for run in self.course_runs:
            course_runs_dict[run.state["priority"]].append(run)

        return dict(course_runs_dict)

    def get_pace(self):
        """
        Returns the course pace computed according to duration and effort fields or
        None if one of these fields is blank or if `is_self_paced` flag is equal to False.

        This method returns a tuple of three values:
        - pace : the float value of the pace (ratio between effort / duration)
        - pace_unit
        - pace_reference_unit
        """
        if self.is_self_paced is True or self.duration is None:
            return None

        if self.effort is None:
            raise ValueError("Cannot compute pace without effort.")

        (effort, effort_unit) = self.effort
        (duration, duration_unit) = self.duration

        time_units_keys = list(dict(defaults.TIME_UNITS))
        if time_units_keys.index(effort_unit) >= time_units_keys.index(duration_unit):
            raise ValueError(
                (
                    "Cannot compute pace with effort unit less than or equal to the duration unit."
                    f" ({effort_unit}/{duration_unit})"
                )
            )

        pace = effort / duration
        return (pace, effort_unit, duration_unit)

    def get_pace_display(self):
        """
        Returns a human readable pace value to display.
        If the course is self paced or has no duration, it returns `Self paced`.
        If pace cannot be computed, it returns None.

        To improve readability, we manage three cases with different renders:
        - Pace is a full hour -> ~2 hours/day
        - Pace is more than a full hour -> ~2h30/day
        - Pace is under an hour -> ~45 minutes/day

        Furthermore, as this information is an estimation, we do not want the
        value be too precise, so we round minutes to fifteen minutes slots.
        """
        try:
            (pace, pace_unit, pace_reference_unit) = self.get_pace()
        except TypeError:
            return _("Self paced")
        except ValueError:
            return None

        time_units = defaults.TIME_UNITS
        pace_in_minutes = pace * 60 if pace_unit == defaults.HOUR else pace
        pace_hours = int(pace_in_minutes // 60)
        pace_minutes = int(pace_in_minutes % 60)
        pace_minutes_rounded_by_quarter = (
            round(pace_minutes / 15) * 15
        )  # round minutes by fifteen

        # Pace is under an hour
        if pace_hours == 0:
            resolution = 15 if pace_minutes > 15 else 5
            return _("~{pace:d} {effort_unit!s}/{duration_unit!s}").format(
                pace=round(pace_minutes / resolution) * resolution
                or 5,  # Display at least 5 minutes
                effort_unit=time_units[defaults.MINUTE][1],
                duration_unit=time_units[pace_reference_unit][0],
            )
        # Pace is a full hour
        if pace_minutes_rounded_by_quarter == 0:
            count_index = 1 if pace_hours > 1 else 0
            return _("~{pace:d} {effort_unit!s}/{duration_unit!s}").format(
                pace=pace_hours,
                effort_unit=time_units[defaults.HOUR][count_index],
                duration_unit=time_units[pace_reference_unit][0],
            )

        # Pace is more than a full hour
        return _("~{pace_hours:d}h{pace_minutes:d}/{duration_unit!s}").format(
            pace_hours=pace_hours,
            pace_minutes=pace_minutes_rounded_by_quarter,
            duration_unit=time_units[pace_reference_unit][0],
        )

    def get_programs(self, language=None):
        """
        Return a query to get the programs related to this course ie for which a plugin for
        this course is linked to the program page via any placeholder.
        """
        return self.get_reverse_related_page_extensions("program", language=language)

    @property
    def state(self):
        """
        The state of the course carrying information on what to display on a course glimpse.

        The game is to find the highest priority state for this course among its course runs.
        """
        # The default state is for a course that has no course runs
        best_state = CourseState(CourseState.TO_BE_SCHEDULED)

        for course_run in self.course_runs.only(
            "start", "end", "enrollment_start", "enrollment_end"
        ):
            state = course_run.state
            best_state = min(state, best_state)
            if state["priority"] == CourseState.ONGOING_OPEN:
                # We found the best state, don't waste more time
                break
        return best_state

    def copy_relations(self, oldinstance, language=None):
        """
        This method is called for 2 types of copying:
            1- cloning (copying a draft page to another position in the page tree)
            2- publishing (copying a draft page to its public counterpart)

        When cloning a course, we do not want the related course runs to follow. Each copy of the
        course has its own distinct runs.

        When publishing a course, the course runs must be manually copied to the public page as
        it should perfectly reflect the state of the draft page at the moment we clicked on the
        publish button.
        """
        # Don't copy the course runs if this is a copy to clone
        if oldinstance.public_extension_id != self.id:
            return

        # Since this is a copy to publish, let's copy the course runs
        for old_course_run in oldinstance.runs.all():
            course_run = CourseRun.objects.get(pk=old_course_run.pk)
            course_run.direct_course = self

            # If the course run already exists on the public course, update it,
            try:
                public_course_run = old_course_run.public_course_run
            except CourseRun.DoesNotExist:
                # Otherwise create a new public course run and link it to its draft
                course_run.draft_course_run_id = old_course_run.id
                course_run.pk = None
                course_run.save()
            else:
                course_run.draft_course_run_id = old_course_run.id
                course_run.pk = public_course_run.pk
                course_run.save()

            course_run.copy_translations(old_course_run, language=language)

    def save(self, *args, **kwargs):
        """
        Enforce validation each time an instance is saved
        """
        self.full_clean()
        super().save(*args, **kwargs)

    def generate_course_runs_offers_dict_rdfa(self):
        """
        Generate course run dict offers for rdfa purposes
        based on the Google developers definition:
        https://developers.google.com/search/docs/appearance/structured-data/course-info?hl=pt-br#guidelines
        """

        def clean_offer(offer: str) -> str:
            return offer.replace(" ", "").replace("_", " ").title()

        return {
            "offers": [
                {
                    "@type": "Offer",
                    "category": clean_offer(run.offer),
                    "priceCurrency": run.price_currency.upper(),
                    "price": float(run.price),
                }
                for run in self.course_runs
            ]
        }


class CourseRunSyncMode(models.TextChoices):
    """Course run synchronization mode choices for the "sync_mode" field."""

    MANUAL = "manual", _("Manual")
    SYNC_TO_DRAFT = "sync_to_draft", _("Synchronization to draft page")
    SYNC_TO_PUBLIC = "sync_to_public", _("Synchronization to public page")


class CourseRunCatalogVisibility(models.TextChoices):
    """Course run catalog visibility choices."""

    COURSE_AND_SEARCH = "course_and_search", _(
        "course_and_search - show on the course page and include in search results"
    )
    COURSE_ONLY = "course_only", _(
        "course_only - show on the course page and hide from search results"
    )
    HIDDEN = "hidden", _("hidden - hide on the course page and from search results")


class CourseRunOffer(models.TextChoices):
    """Course run offer choices."""

    FREE = "free", _("free - The entire course can be completed without cost")
    PARTIALLY_FREE = "partially_free", _(
        "partially_free - More than half of the course is for free"
    )
    SUBSCRIPTION = "subscription", _(
        "subscription - Must be a subscriber or paid member to complete the entire course"
    )
    PAID = "paid", _("paid - Must pay to complete the course")


class CertificateOffer(models.TextChoices):
    """Course run offer choices."""

    FREE = "free", _("free - The certification can be completed without cost")
    SUBSCRIPTION = "subscription", _(
        "subscription - Must be a subscriber or paid member to carry out the certification process"
    )
    PAID = "paid", _("paid - Must pay to carry out the certification process")


class CourseRunDisplayMode(models.TextChoices):
    """Course run catalog display modes."""

    COMPACT = "compact", _(
        "compact - show minimal information about the course run (only for products)."
    )
    DETAILED = "detailed", _(
        "detailed - show all information about the course run (only for products)."
    )


class CourseRun(TranslatableModel):
    """
    The course run represents and records the occurence of a course between a start
    and an end date.
    """

    direct_course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="runs"
    )
    # We register the foreign key in "draft_course_run" and not in "public_course_run"
    # so that the public course run gets deleted by cascade in the database when the
    # draft page is deleted. Doing it the other way would be fragile.
    draft_course_run = models.OneToOneField(
        "self",
        on_delete=models.CASCADE,
        null=True,
        editable=False,
        related_name="public_course_run",
    )
    sync_mode = models.CharField(
        max_length=20,
        choices=CourseRunSyncMode.choices,
        default=CourseRunSyncMode.MANUAL,
        verbose_name=_("Synchronization mode"),
    )
    title = TranslatedField()
    resource_link = models.CharField(
        _("resource link"), max_length=200, blank=True, null=True
    )
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
    enrollment_count = models.PositiveIntegerField(
        _("enrollment count"),
        default=0,
        blank=True,
        help_text=_("The number of enrolled students"),
    )
    catalog_visibility = models.CharField(
        _("catalog visibility"),
        choices=CourseRunCatalogVisibility.choices,
        default=CourseRunCatalogVisibility.COURSE_AND_SEARCH,
        blank=False,
        max_length=20,
    )
    price = models.DecimalField(
        _("price"),
        max_digits=9,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_("The price of the course run"),
    )
    price_currency = models.CharField(
        max_length=7,
        default=getattr(settings, "RICHIE_DEFAULT_COURSE_RUN_PRICE_CURRENCY", "EUR"),
    )
    offer = models.CharField(
        _("offer"),
        choices=lazy(lambda: CourseRunOffer.choices, tuple)(),
        default=getattr(
            settings, "RICHIE_DEFAULT_COURSE_RUN_OFFER", CourseRunOffer.FREE
        ),
        blank=False,
        max_length=20,
    )
    certificate_price = models.DecimalField(
        _("certificate_price"),
        max_digits=9,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_("The price of the certificate"),
    )
    certificate_offer = models.CharField(
        _("certificate_offer"),
        choices=lazy(lambda: CertificateOffer.choices, tuple)(),
        default=getattr(
            settings,
            "RICHIE_DEFAULT_COURSE_RUN_CERTIFICATE_OFFER",
            CertificateOffer.FREE,
        ),
        blank=False,
        max_length=20,
    )
    display_mode = models.CharField(
        choices=CourseRunDisplayMode.choices,
        default=CourseRunDisplayMode.DETAILED,
        blank=False,
        max_length=20,
    )

    class Meta:
        db_table = "richie_course_run"
        verbose_name = _("course run")
        verbose_name_plural = _("course runs")

    def __str__(self):
        """Human representation of a course run."""
        start = f"{self.start:%y/%m/%d %H:%M} - " if self.start else ""
        return f"Course run {self.id!s} starting {start:s}"

    def copy_translations(self, oldinstance, language=None):
        """Copy translation objects for a language if provided or for all languages."""
        query = CourseRunTranslation.objects.filter(master=oldinstance)
        if language:
            query = query.filter(language_code=language)

        for translation_object in query:
            try:
                target_pk = CourseRunTranslation.objects.filter(
                    master=self, language_code=translation_object.language_code
                ).values_list("pk", flat=True)[0]
            except IndexError:
                translation_object.pk = None
            else:
                translation_object.pk = target_pk
            translation_object.master = self
            translation_object.save()

    def mark_course_dirty(self):
        """
        Mark the related course page as dirty if the course run has changed since it was last
        published, so that the modifications can be checked and confirmed by a reviewer.
        """
        try:
            public_instance = self.__class__.objects.get(draft_course_run__pk=self.pk)
        except self.__class__.DoesNotExist:
            # This is a new instance, mark page dirty in all languages unless
            # the course run is yet to be scheduled (hidden from public page in this case)
            if self.state["priority"] < CourseState.TO_BE_SCHEDULED:
                self.direct_course.extended_object.title_set.update(
                    publisher_state=PUBLISHER_STATE_DIRTY
                )
            return

        is_visible = (
            self.state["priority"] < CourseState.TO_BE_SCHEDULED
            or public_instance.state["priority"] < CourseState.TO_BE_SCHEDULED
        )
        # Mark the related course page dirty if the course run content has changed
        # Break out of the for loop as soon as we found a difference
        for field in self._meta.fields:
            if field.name == "direct_course":
                if (
                    public_instance.direct_course.draft_extension != self.direct_course
                    and is_visible
                ):
                    self.direct_course.extended_object.title_set.update(
                        publisher_state=PUBLISHER_STATE_DIRTY
                    )  # mark target page dirty in all languages
                    page = public_instance.direct_course.draft_extension.extended_object
                    page.title_set.update(
                        publisher_state=PUBLISHER_STATE_DIRTY
                    )  # mark source page dirty in all languages
                    break
            elif (
                field.editable
                and not field.auto_created
                and getattr(public_instance, field.name) != getattr(self, field.name)
                and is_visible
            ):
                self.direct_course.extended_object.title_set.update(
                    publisher_state=PUBLISHER_STATE_DIRTY
                )  # mark page dirty in all languages
                break

    def save(self, *args, **kwargs):
        """Enforce validation each time an instance is saved."""
        self.full_clean()
        super().save(*args, **kwargs)

    # pylint: disable=signature-differs
    def delete(self, *args, **kwargs):
        """
        Mark the related course page as dirty if the course about to be deleted was
        published and visible (not to be scheduled).
        """
        try:
            # pylint: disable=no-member
            public_course_run = self.public_course_run
        except CourseRun.DoesNotExist:
            pass
        else:
            if public_course_run.state["priority"] < CourseState.TO_BE_SCHEDULED:
                self.direct_course.extended_object.title_set.update(
                    publisher_state=PUBLISHER_STATE_DIRTY
                )  # mark page dirty in all languages
        return super().delete(*args, **kwargs)

    # pylint: disable=too-many-return-statements
    @staticmethod
    def compute_state(start, end, enrollment_start, enrollment_end):
        """
        Compute at the current time the state of a course run that would have the dates
        passed in argument.

        A static method not using the instance allows to call it with an Elasticsearch result.
        """
        if not start or not enrollment_start:
            return CourseState(CourseState.TO_BE_SCHEDULED)

        # course run end dates are not required and should default to forever
        # e.g. a course run with no end date is presumed to be always on-going
        end = end or MAX_DATE
        enrollment_end = enrollment_end or MAX_DATE

        now = django_timezone.now()
        if start < now:
            if end > now:
                if enrollment_end > now:
                    # ongoing open
                    return CourseState(CourseState.ONGOING_OPEN, enrollment_end)
                # ongoing closed
                return CourseState(CourseState.ONGOING_CLOSED)
            if enrollment_start < now < enrollment_end:
                # archived open
                return CourseState(CourseState.ARCHIVED_OPEN, enrollment_end)
            # archived closed
            return CourseState(CourseState.ARCHIVED_CLOSED)
        if enrollment_start > now:
            # future not yet open
            return CourseState(CourseState.FUTURE_NOT_YET_OPEN, start)
        if enrollment_end > now:
            # future open
            return CourseState(CourseState.FUTURE_OPEN, start)
        # future already closed
        return CourseState(CourseState.FUTURE_CLOSED)

    @property
    def state(self):
        """Return the state of the course run at the current time."""
        return self.compute_state(
            self.start, self.end, self.enrollment_start, self.enrollment_end
        )

    def get_course(self):
        """Get the course for this course run."""
        is_draft = self.direct_course.extended_object.publisher_is_draft
        ancestor_nodes = self.direct_course.extended_object.node.get_ancestors()
        return Course.objects.filter(
            # Joining on `cms_pages` generate duplicates for courses that are under a parent page
            # when this page exists both in draft and public versions. We need to exclude the
            # parent public page to avoid this duplication
            Q(
                extended_object__node__cms_pages__publisher_is_draft=is_draft
            )  # course has a parent
            | Q(extended_object__node__isnull=True),  # course has no parent
            # Target courses that are ancestors of the course related to the course run
            Q(id=self.direct_course_id) | Q(extended_object__node__in=ancestor_nodes),
            # Exclude snapshots
            extended_object__node__parent__cms_pages__course__isnull=True,  # exclude snapshots
            # Get the course in the same version as the course run
            extended_object__publisher_is_draft=is_draft,
        ).distinct()[0]

    @property
    def safe_title(self):
        """
        Access the `title` translatable field from the `CourseRunTranslation` on a safe way.
        """
        try:
            return self.title
        except ObjectDoesNotExist:
            return None

    @property
    def is_visible_on_course_page(self):
        """Return True if the course run is visible on the course page"""
        return self.catalog_visibility != CourseRunCatalogVisibility.HIDDEN


class CourseRunTranslation(TranslatedFieldsModel):
    """
    CourseRun Translation model.

    Django parler model linked to the CourseRun to internationalize the fields.
    """

    master = models.ForeignKey(CourseRun, models.CASCADE, related_name="translations")
    title = models.CharField(_("title"), null=True, blank=True, max_length=255)

    class Meta:
        db_table = "richie_course_run_translation"
        unique_together = ("language_code", "master")
        verbose_name = _("Course run translation")
        verbose_name_plural = _("Course run translations")

    def __str__(self):
        """Human representation of a course run translation."""
        model = self._meta.verbose_name.title()
        title = self.title or str(_("Empty title"))

        return f"{model:s}: {title:s}"

    # pylint: disable=signature-differs
    def save(self, *args, **kwargs):
        """
        Mark related course page dirty if the title has changed compared to the public version.
        """
        if (
            # Does the public translation have a different title?
            self.__class__.objects.filter(
                master__draft_course_run__translations__pk=self.pk,
                language_code=self.language_code,
            )
            .exclude(title=self.title)
            .exists()
        ):
            self.master.direct_course.extended_object.title_set.filter(
                language=self.language_code
            ).update(
                publisher_state=PUBLISHER_STATE_DIRTY
            )  # mark page dirty

        return super().save(*args, **kwargs)


class CoursePluginModel(CMSPlugin):
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
    variant = models.CharField(
        _("variant"),
        max_length=50,
        choices=defaults.COURSE_GLIMPSE_VARIANT_CHOICES,
        help_text=_("Optional glimpse variant for a custom look."),
        blank=True,
        null=True,
    )

    class Meta:
        db_table = "richie_course_plugin"
        verbose_name = _("course plugin")
        verbose_name_plural = _("course plugins")

    def __str__(self):
        """Human representation of a page plugin"""
        return self.page.get_title()


class Licence(TranslatableModel):
    """
    Licence model.

    Instances of this models should only be created by administrators.
    """

    name = TranslatedField()
    content = TranslatedField()
    logo = FilerImageField(
        verbose_name=_("logo"), on_delete=models.PROTECT, related_name="licence"
    )
    url = models.CharField(_("url"), blank=True, max_length=255)
    # Deprecated non-translated fields for name & content
    # Kept around to avoid a breaking change wrt. blue-green deployments
    name_deprecated = models.CharField(_("name"), db_column="name", max_length=200)
    content_deprecated = models.TextField(
        _("content"), blank=False, db_column="content", default=""
    )

    class Meta:
        db_table = "richie_licence"
        verbose_name = _("licence")
        verbose_name_plural = _("licences")

    def __str__(self):
        """Human representation of a licence."""
        model = self._meta.verbose_name.title()
        return f"{model:s}: {self.name:s}"


class LicenceTranslation(TranslatedFieldsModel):
    """
    Licence Translation model.

    Django parler model linked to the Licence to internationalize the fields.
    """

    master = models.ForeignKey(Licence, models.CASCADE, related_name="translations")
    name = models.CharField(_("name"), max_length=200)
    content = models.TextField(_("content"), blank=False, default="")

    class Meta:
        db_table = "richie_licence_translation"
        unique_together = ("language_code", "master")
        verbose_name = _("Licence translation")
        verbose_name_plural = _("licence translations")

    def __str__(self):
        """Human representation of a licence translation."""
        model = self._meta.verbose_name.title()
        return f"{model:s}: {self.name:s}"


class LicencePluginModel(CMSPlugin):
    """
    Licence plugin model.
    """

    licence = models.ForeignKey(Licence, on_delete=models.CASCADE)
    description = models.TextField(_("description"), blank=True, default="")

    class Meta:
        db_table = "richie_licence_plugin"
        verbose_name = _("licence plugin")
        verbose_name_plural = _("licence plugins")

    def __str__(self):
        """Human representation of a licence plugin."""
        model = self._meta.verbose_name.title()
        return f"{model:s}: {self.licence.name:s}"


extension_pool.register(Course)
