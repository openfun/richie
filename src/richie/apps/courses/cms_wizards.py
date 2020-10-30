"""
CMS Wizard to add a course page
"""
from django import forms
from django.core import validators
from django.core.exceptions import PermissionDenied
from django.template.defaultfilters import slugify
from django.utils.functional import cached_property
from django.utils.translation import get_language
from django.utils.translation import gettext_lazy as _

from cms.api import add_plugin, create_page
from cms.cms_wizards import (
    CMSPageWizard,
    CMSSubPageWizard,
    cms_page_wizard,
    cms_subpage_wizard,
)
from cms.forms.wizards import CreateCMSPageForm, CreateCMSSubPageForm, SlugWidget
from cms.models import Page
from cms.utils.page_permissions import user_can_change_page
from cms.wizards.forms import BaseFormMixin
from cms.wizards.wizard_base import Wizard
from cms.wizards.wizard_pool import wizard_pool

from ..core import defaults as core_defaults
from . import defaults
from .helpers import snapshot_course
from .models import BlogPost, Category, Course, CourseRun, Organization, Person, Program


class ExcludeRootReverseIDMixin:
    """A mixin for wizards to disable it on portion of sites that are managed by Richie."""

    def user_has_add_permission(self, user, page):
        """Check that the page or any of its ancestors is not a special Richie page."""
        if (
            page.reverse_id in defaults.ROOT_REVERSE_IDS
            or page.get_ancestor_pages()
            .filter(reverse_id__in=defaults.ROOT_REVERSE_IDS)
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


class BaseWizardForm(BaseFormMixin, forms.Form):
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
        validators=[validators.validate_slug],
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
            raise forms.ValidationError({"slug": [_("This slug is already in use")]})

        return cleaned_data

    @cached_property
    def parent_page(self):
        """
        The parent page for each type of page is defined on its page extension model.
        """
        try:
            return Page.objects.get(
                reverse_id=self.model.PAGE["reverse_id"], publisher_is_draft=True
            )
        except Page.DoesNotExist as error:
            raise forms.ValidationError(
                {
                    "slug": [
                        _(
                            "You must first create a parent page and set its `reverse_id` to "
                            "`{reverse}`.".format(reverse=self.model.PAGE["reverse_id"])
                        )
                    ]
                }
            ) from error

    def save(self):
        """
        Create the page with "title" and "slug"
        """
        return create_page(
            title=self.cleaned_data["title"],
            slug=self.cleaned_data["slug"],
            language=get_language(),
            parent=self.parent_page,
            template=self.model.PAGE["template"],
            published=False,  # The creation wizard should not publish the page
        )


class CourseWizardForm(BaseWizardForm):
    """
    This form is used by the wizard that creates a new course page.
    A related Course model is created for each course page.
    """

    model = Course

    def clean(self):
        """
        Permission to add a course was already checked when we displayed the list of wizard
        entries, but we need to prevent form hacking.
        """
        # The current page should be an organization
        if not self.page:
            raise PermissionDenied()

        try:
            self.page.organization
        except Organization.DoesNotExist as error:
            raise PermissionDenied() from error

        # The user should be allowed to modify this organization page
        if not user_can_change_page(self.user, self.page):
            raise PermissionDenied()

        # The user should have permission to create a course object
        if not (self.user.is_staff and self.user.has_perm("courses.add_course")):
            raise PermissionDenied()

        return super().clean()

    def save(self):
        """
        The parent form created the page.
        This method creates the associated course page extension.
        If the current page is an organization, the new course should get attached to it via a
        plugin, and the admin group of the organization should get admin access to the course.
        """
        page = super().save()
        course = Course.objects.create(extended_object=page)
        course.create_page_role()

        try:
            organization = self.page.organization
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
            course.create_permissions_for_organization(organization)

        return page


class CourseWizard(Wizard):
    """Inherit from Wizard because each wizard must have its own Python class."""

    def user_has_add_permission(self, user, **kwargs):
        """
        Returns: True if the user has the permission to add course objects, False otherwise.

        A course can only be created when visiting an organization page (that will become the
        course's main organization) that the user has the right to update.
        """
        if not kwargs.get("page"):
            return False

        try:
            organization = kwargs["page"].organization
        except Organization.DoesNotExist:
            return False

        return (
            user.has_perm("courses.add_course")
            and user_can_change_page(user, organization.extended_object)
            and super().user_has_add_permission(user, **kwargs)
        )


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

    @cached_property
    def parent_page(self):
        """
        The parent page of a course run is the course page from which it is being created.
        """
        return self.page

    def clean(self):
        """
        Permission to add a course run was already checked when we displayed the list of wizard
        entries, but we need to prevent form hacking.
        """
        try:
            course = self.page.course
        except Course.DoesNotExist as error:
            raise forms.ValidationError(
                "Course runs can only be created from a course page."
            ) from error
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

        # The user should have permission to create a course run object
        if not (self.user.is_staff and self.user.has_perm("courses.add_courserun")):
            raise PermissionDenied()

        if self.cleaned_data["should_snapshot_course"]:
            try:
                snapshot_course(self.page, self.user, simulate_only=True)
            except PermissionDenied as context:
                # In this case, where the attempt results from a ticked checkbox, we should
                # raise the exception as a validation error so it is displayed on the form.
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

        # Look for a language matching the active language in the list of ALL_LANGUAGES
        # (it might happen that the project was configured in a way that the active language
        # is not one of the possibilities in ALL_LANGUAGES)
        languages = []
        active_language = get_language()
        if active_language in core_defaults.ALL_LANGUAGES_DICT:
            languages.append(active_language)
        else:
            # if "fr-ca" was not found, look for the first language that starts with "fr-"
            generic_language_code = active_language.split("-")[0]
            for language_candidate in core_defaults.ALL_LANGUAGES_DICT:
                if language_candidate.startswith(generic_language_code):
                    languages.append(language_candidate)
                    break

        CourseRun.objects.create(extended_object=page, languages=languages)
        return page


class CourseRunWizard(Wizard):
    """Inherit from Wizard because each wizard must have its own Python class."""

    def user_has_add_permission(self, user, **kwargs):
        """
        Returns: True if it is possible to add a course run, False otherwise:
            - the user should have the permission to add course run objects,
            - course runs can only be created from a course page,
            - if should not be possible to add a course run below a course snapshot.
        """
        try:
            course = kwargs["page"].course
        except Course.DoesNotExist:
            # Course runs can only be created from a course page
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

        # The user should have permission to create a course run object
        return user.has_perm(
            "courses.add_courserun"
        ) and super().user_has_add_permission(user, **kwargs)


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

    def clean(self):
        """
        Permission to add an organization was already checked when we displayed the list of
        wizard entries, but we need to prevent form hacking.
        """
        # The user should have permission to create an organization object
        if not (self.user.is_staff and self.user.has_perm("courses.add_organization")):
            raise PermissionDenied()

        return super().clean()

    def save(self):
        """
        The parent form created the page.
        This method creates the associated organization.
        """
        page = super().save()
        organization = Organization.objects.create(extended_object=page)
        organization.create_page_role()
        return page


class OrganizationWizard(Wizard):
    """Inherit from Wizard because each wizard must have its own Python class."""

    def user_has_add_permission(self, user, **kwargs):
        """
        Returns: True if the user has the permission to add organization objects, False otherwise.
        """
        return user.has_perm(
            "courses.add_organization"
        ) and super().user_has_add_permission(user, **kwargs)


wizard_pool.register(
    OrganizationWizard(
        title=_("New organization page"),
        description=_("Create a new organization page"),
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

    def clean(self):
        """
        Permission to add an category was already checked when we displayed the list of
        wizard entries, but we need to prevent form hacking.
        """
        # The user should have permission to create a category object
        if not (self.user.is_staff and self.user.has_perm("courses.add_category")):
            raise PermissionDenied()

        return super().clean()

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

    def user_has_add_permission(self, user, **kwargs):
        """
        Returns: True if the user has the permission to add category objects, False otherwise.
        """
        return user.has_perm(
            "courses.add_category"
        ) and super().user_has_add_permission(user, **kwargs)


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

    def clean(self):
        """
        Permission to add an blog post was already checked when we displayed the list of
        wizard entries, but we need to prevent form hacking.
        """
        # The user should have permission to create a blog post object
        if not (self.user.is_staff and self.user.has_perm("courses.add_blogpost")):
            raise PermissionDenied()

        return super().clean()

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

    def user_has_add_permission(self, user, **kwargs):
        """
        Returns: True if the user has the permission to add blog post objects, False otherwise.
        """
        return user.has_perm(
            "courses.add_blogpost"
        ) and super().user_has_add_permission(user, **kwargs)


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

    model = Person

    def clean(self):
        """
        Permission to add an person was already checked when we displayed the list of
        wizard entries, but we need to prevent form hacking.
        """
        # The user should have permission to create a person object
        if not (self.user.is_staff and self.user.has_perm("courses.add_person")):
            raise PermissionDenied()

        return super().clean()

    def save(self):
        """
        The parent form created the page.
        This method creates the associated person page extension.
        """
        page = super().save()
        Person.objects.create(extended_object=page)
        return page


class PersonWizard(Wizard):
    """Inherit from Wizard because each wizard must have its own Python class."""

    def user_has_add_permission(self, user, **kwargs):
        """
        Returns: True if the user has the permission to add person objects, False otherwise.
        """
        return user.has_perm("courses.add_person") and super().user_has_add_permission(
            user, **kwargs
        )


wizard_pool.register(
    PersonWizard(
        title=_("New person page"),
        description=_("Create a new person page"),
        model=Person,
        form=PersonWizardForm,
        weight=200,
    )
)


class ProgramWizardForm(BaseWizardForm):
    """
    This form is used by the wizard that creates a new program
    A related program model is created for each program
    """

    model = Program

    def clean(self):
        """
        Permission to add a program was already checked when we displayed the list of
        wizard entries, but we need to prevent form hacking.
        """
        # The user should have permission to create a program object
        if not (self.user.is_staff and self.user.has_perm("courses.add_program")):
            raise PermissionDenied()

        return super().clean()

    def save(self):
        """
        The parent form created the page.
        This method creates the associated program.
        """
        page = super().save()
        Program.objects.create(extended_object=page)
        return page


class ProgramWizard(Wizard):
    """Inherit from Wizard because each wizard must have its own Python class."""

    def user_has_add_permission(self, user, **kwargs):
        """
        Returns: True if the user has the permission to add program objects, False otherwise.
        """
        return user.has_perm("courses.add_program") and super().user_has_add_permission(
            user, **kwargs
        )


wizard_pool.register(
    ProgramWizard(
        title=_("New program"),
        description=_("Create a new program"),
        model=Program,
        form=ProgramWizardForm,
        weight=200,
    )
)
