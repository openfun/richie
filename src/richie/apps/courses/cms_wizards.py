"""
CMS Wizard to add a course page
"""
from django import forms
from django.core.exceptions import PermissionDenied
from django.template.defaultfilters import slugify
from django.utils.functional import cached_property
from django.utils.translation import get_language
from django.utils.translation import ugettext_lazy as _

from cms.api import add_plugin, create_page
from cms.cms_wizards import (
    CMSPageWizard,
    CMSSubPageWizard,
    cms_page_wizard,
    cms_subpage_wizard,
)
from cms.forms.wizards import CreateCMSPageForm, CreateCMSSubPageForm, SlugWidget
from cms.models import Page
from cms.wizards.wizard_base import Wizard
from cms.wizards.wizard_pool import wizard_pool

from .helpers import snapshot_course
from .models import (
    ROOT_REVERSE_IDS,
    BlogPost,
    Category,
    Course,
    CourseRun,
    Organization,
    Person,
    PersonTitle,
)


class ExcludeRootReverseIDMixin:
    """A mixin for wizards to disable it on portion of sites that are managed by Richie."""

    def user_has_add_permission(self, user, page):
        """Check that the page or any of its ancestors is not a special Richie page."""
        if (
            page.reverse_id in ROOT_REVERSE_IDS
            or page.get_ancestor_pages()
            .filter(reverse_id__in=ROOT_REVERSE_IDS)
            .exists()
        ):
            return False
        return super().user_has_add_permission(user, page)


class RichieCMSPageWizard(ExcludeRootReverseIDMixin, CMSPageWizard):
    """A page wizard that can not be created below our Richie extended pages."""


class RichieCMSSubPageWizard(ExcludeRootReverseIDMixin, CMSSubPageWizard):
    """A subpage wizard that can not be created below our Richie extended pages."""


wizard_pool.unregister(cms_page_wizard)
wizard_pool.register(
    RichieCMSPageWizard(
        title=_("New page"),
        weight=100,
        form=CreateCMSPageForm,
        model=Page,
        description=_("Create a new page next to the current page."),
    )
)

wizard_pool.unregister(cms_subpage_wizard)
wizard_pool.register(
    RichieCMSSubPageWizard(
        title=_("New sub page"),
        weight=110,
        form=CreateCMSSubPageForm,
        model=Page,
        description=_("Create a page below the current page."),
    )
)


class BaseWizardForm(forms.Form):
    """
    Factorize the part of the wizard form that handles the title and the slug as they are
    common to all our wizard forms.
    """

    title = forms.CharField(
        max_length=255,
        required=True,
        widget=forms.TextInput(),
        label=_("Page title"),
        help_text=_("Title of the page in current language"),
    )
    slug = forms.CharField(
        max_length=200,  # Should be less than 255, the "max_length" of a Page's "path" field
        required=False,
        widget=SlugWidget(),
        label=_("Page slug"),
        help_text=_("Slug of the page in current language"),
    )

    def clean(self):
        """
        Ensure that the slug field is set or derive it from the title
        """
        cleaned_data = super().clean()

        # If the slug is not explicitly set, generate it from the title
        if cleaned_data.get("title") and not cleaned_data.get("slug"):
            cleaned_data["slug"] = slugify(cleaned_data["title"])[:200]

        if self.parent_page:
            # Check that the length of the slug is compatible with its parent page:
            #  a page `path` is limited to 255 chars, therefore the course page slug should
            # always be shorter than (255 - length of parent page path - 1 character for the "/")
            length = len(self.parent_page.get_path()) + 1 + len(cleaned_data["slug"])
            if length > 255:
                raise forms.ValidationError(
                    {
                        "slug": [
                            _(
                                "This slug is too long. The length of the path built by "
                                "prepending the slug of the parent page would be {:d} characters "
                                "long and it should be less than 255".format(length)
                            )
                        ]
                    }
                )

            if (
                self.parent_page.get_child_pages()
                .filter(title_set__slug=cleaned_data["slug"])
                .exists()
            ):
                raise forms.ValidationError(
                    {"slug": [_("This slug is already in use")]}
                )

        return cleaned_data

    @cached_property
    def parent_page(self):
        """
        The parent page for each type of page is defined on its page extension model.
        """
        try:
            return Page.objects.get(
                reverse_id=self.model.ROOT_REVERSE_ID, publisher_is_draft=True
            )
        except Page.DoesNotExist:
            raise forms.ValidationError(
                {
                    "slug": [
                        _(
                            "You must first create a parent page and set its `reverse_id` to "
                            "`{reverse}`.".format(reverse=self.model.ROOT_REVERSE_ID)
                        )
                    ]
                }
            )

    def save(self):
        """
        Create the page with "title" and "slug"
        """
        return create_page(
            title=self.cleaned_data["title"],
            slug=self.cleaned_data["slug"],
            language=get_language(),
            parent=self.parent_page,
            template=self.model.TEMPLATE_DETAIL,
            published=False,  # The creation wizard should not publish the page
        )


class CourseWizardForm(BaseWizardForm):
    """
    This form is used by the wizard that creates a new course page.
    A related Course model is created for each course page.
    """

    model = Course

    def save(self):
        """
        The parent form created the page.
        This method creates the associated course page extension.
        If the current page is an organization, the new course should get attached to it via a
        plugin.
        """
        page = super().save()
        course = Course.objects.create(extended_object=page)

        try:
            self.page.organization
        except Organization.DoesNotExist:
            pass
        else:
            # Add a plugin for the organization
            placeholder = course.extended_object.placeholders.get(
                slot="course_organizations"
            )
            add_plugin(
                language=get_language(),
                placeholder=placeholder,
                plugin_type="OrganizationPlugin",
                **{"page": self.page},
            )

        return page


class CourseWizard(Wizard):
    """Inherit from Wizard because each wizard must have its own Python class."""


wizard_pool.register(
    CourseWizard(
        title=_("New course page"),
        description=_("Create a new course page"),
        model=Course,
        form=CourseWizardForm,
        weight=200,
    )
)


class CourseRunWizardForm(BaseWizardForm):
    """
    This form is used by the wizard that creates a new course run page.
    A related CourseRun model is created for each course run page.
    """

    should_snapshot_course = forms.BooleanField(
        label=_("Snapshot the course"),
        help_text=_(
            "Tick this box if you want to snapshot the current version of the course and link "
            "the new course run to a new version of the course."
        ),
        required=False,
    )

    model = CourseRun

    @property
    def parent_page(self):
        """
        The parent page of a course run is the course page from which it is being created.
        """
        return self.page

    def clean(self):
        """
        Permission to add a course run was already checked when we displayed the list of wizard
        entries, gut we need to prevent form hacking.
        """
        try:
            course = self.page.course
        except Course.DoesNotExist:
            raise forms.ValidationError(
                "Course runs can only be created from a course page."
            )
        else:
            if course.extended_object.parent_page:
                try:
                    course.extended_object.parent_page.course
                except Course.DoesNotExist:
                    pass
                else:
                    raise forms.ValidationError(
                        "Course runs can not be created from a course snapshot page."
                    )

        if self.cleaned_data["should_snapshot_course"]:
            try:
                snapshot_course(self.page, self.user, simulate_only=True)
            except PermissionDenied as context:
                raise forms.ValidationError(context)

        return super().clean()

    def save(self):
        """
        The parent form created the page.
        This method creates the associated course run page extension.
        """
        # Start by snapshotting the course if it is requested
        if self.cleaned_data["should_snapshot_course"]:
            snapshot_course(self.page, self.user)

        page = super().save()
        CourseRun.objects.create(extended_object=page, languages=[get_language()])
        return page


class CourseRunWizard(Wizard):
    """Inherit from Wizard because each wizard must have its own Python class."""

    def user_has_add_permission(self, user, **kwargs):
        try:
            course = kwargs["page"].course
        except Course.DoesNotExist:
            return False
        else:
            # If the course has a parent that is a course page, it is a snapshot and should
            # therefore not be allowed to received a new course run (it can still be done
            # by moving the course run after it's created, so we don't want to make it a main
            # feature as it can lead to mistakes with occasional users).
            if course.extended_object.parent_page:
                try:
                    course.extended_object.parent_page.course
                except Course.DoesNotExist:
                    pass
                else:
                    return False

        return super().user_has_add_permission(user, **kwargs)


wizard_pool.register(
    CourseRunWizard(
        title=_("New course run page"),
        description=_("Create a new course run page"),
        model=CourseRun,
        form=CourseRunWizardForm,
        weight=200,
    )
)


class OrganizationWizardForm(BaseWizardForm):
    """
    This form is used by the wizard that creates a new organization page
    A related organization model is created for each organization page
    """

    model = Organization

    def save(self):
        """
        The parent form created the page.
        This method creates the associated organization.
        """
        page = super().save()
        Organization.objects.create(extended_object=page)
        return page


class OrganizationWizard(Wizard):
    """Inherit from Wizard because each wizard must have its own Python class."""


wizard_pool.register(
    OrganizationWizard(
        title=_("New Organization page"),
        description=_("Create a new Organization page"),
        model=Organization,
        form=OrganizationWizardForm,
        weight=200,
    )
)


class CategoryWizardForm(BaseWizardForm):
    """
    This form is used by the wizard that creates a new category page.
    A related Category model is created for each category page.
    """

    model = Category

    @cached_property
    def parent_page(self):
        """
        If the current page is a category, the new category should be created as a child.
        Otherwise, it defaults to the categories root page defined by the `ROOT_REVERSE_ID`
        property of the Category model.
        """
        try:
            self.page.category
        except Category.DoesNotExist:
            return super().parent_page
        else:
            return self.page

    def save(self):
        """
        The parent form created the page.
        This method creates the associated category page extension.
        """
        page = super().save()
        Category.objects.create(extended_object=page)
        return page


class CategoryWizard(Wizard):
    """Inherit from Wizard because each wizard must have its own Python class."""


wizard_pool.register(
    CategoryWizard(
        title=_("New category page"),
        description=_("Create a new category page"),
        model=Category,
        form=CategoryWizardForm,
        weight=200,
    )
)


class BlogPostWizardForm(BaseWizardForm):
    """
    This form is used by the wizard that creates a new blog post
    A related blogpost model is created for each blog post
    """

    model = BlogPost

    def save(self):
        """
        The parent form created the page.
        This method creates the associated blogpost.
        """
        page = super().save()
        BlogPost.objects.create(extended_object=page)
        return page


class BlogPostWizard(Wizard):
    """Inherit from Wizard because each wizard must have its own Python class."""


wizard_pool.register(
    BlogPostWizard(
        title=_("New blog post"),
        description=_("Create a new blog post"),
        model=BlogPost,
        form=BlogPostWizardForm,
        weight=200,
    )
)


class PersonWizardForm(BaseWizardForm):
    """
    This form is used by the wizard that creates a new person page.
    A related Person model is created for each person page.
    """

    person_title = forms.ModelChoiceField(
        required=False,
        queryset=PersonTitle.objects.all(),
        label=_("Title"),
        help_text=_("Choose this person's title among existing ones"),
    )
    first_name = forms.CharField(
        max_length=200, widget=forms.TextInput(), label=_("First Name")
    )
    last_name = forms.CharField(
        max_length=200, widget=forms.TextInput(), label=_("Last Name")
    )

    model = Person

    def save(self):
        """
        The parent form created the page.
        This method creates the associated person page extension.
        """
        page = super().save()
        Person.objects.create(
            extended_object=page,
            person_title=self.cleaned_data["person_title"],
            first_name=self.cleaned_data["first_name"],
            last_name=self.cleaned_data["last_name"],
        )
        return page


class PersonWizard(Wizard):
    """Inherit from Wizard because each wizard must have its own Python class."""


wizard_pool.register(
    PersonWizard(
        title=_("New person page"),
        description=_("Create a new person page"),
        model=Person,
        form=PersonWizardForm,
        weight=200,
    )
)
