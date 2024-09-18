"""
CMS Wizard to add a course page
"""

from django import forms
from django.conf import settings
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

from . import defaults, models, utils


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
                            "prepending the slug of the parent page would be {:d} "
                            "characters long and it should be less than 255"
                        ).format(length)
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
            reverse_id = self.model.PAGE["reverse_id"]
            raise forms.ValidationError(
                {
                    "slug": [
                        _(
                            "You must first create a parent page and set its `reverse_id` to "
                            "`{:s}`."
                        ).format(reverse_id)
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
            in_navigation=True,
            published=False,  # The creation wizard should not publish the page
        )


class CourseWizardForm(BaseWizardForm):
    """
    This form is used by the wizard that creates a new course page.
    A related Course model is created for each course page.
    """

    code = forms.CharField(
        max_length=models.Course.CODE_MAX_LENGTH,
        required=getattr(settings, "RICHIE_COURSE_CODE_REQUIRED", False),
        label=_("Code"),
        help_text=_("Unique reference for the course."),
    )

    model = models.Course

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
        except models.Organization.DoesNotExist as error:
            raise PermissionDenied() from error

        # The user should be allowed to modify this organization page
        if not user_can_change_page(self.user, self.page):
            raise PermissionDenied()

        # The user should have permission to create a course object
        if not (self.user.is_staff and self.user.has_perm("courses.add_course")):
            raise PermissionDenied()

        return super().clean()

    def clean_code(self):
        """Ensure that the code field is unique among pages."""
        code = utils.normalize_code(self.cleaned_data["code"])
        if code and models.Course.objects.filter(code=code).exists():
            raise forms.ValidationError("A course already exists with this code.")

        return code

    def save(self):
        """
        The parent form created the page.
        This method creates the associated course page extension.
        If the current page is an organization, the new course should get attached to it via a
        plugin, and the admin group of the organization should get admin access to the course.
        """
        page = super().save()
        course = models.Course.objects.create(
            extended_object=page, code=self.cleaned_data["code"]
        )
        course.create_page_role()

        try:
            organization = self.page.organization
        except models.Organization.DoesNotExist:
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
        except models.Organization.DoesNotExist:
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
        model=models.Course,
        form=CourseWizardForm,
        weight=200,
    )
)


class OrganizationWizardForm(BaseWizardForm):
    """
    This form is used by the wizard that creates a new organization page
    A related organization model is created for each organization page
    """

    code = forms.CharField(
        max_length=models.Organization.CODE_MAX_LENGTH,
        required=getattr(settings, "RICHIE_ORGANIZATION_CODE_REQUIRED", False),
        label=_("Code"),
        help_text=_("Unique reference for the organization."),
    )

    model = models.Organization

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
        organization = models.Organization.objects.create(
            extended_object=page, code=self.cleaned_data["code"]
        )
        organization.create_page_role()
        return page

    def clean_code(self):
        """Ensure that the code field is unique among pages."""
        code = utils.normalize_code(self.cleaned_data["code"])
        if code and models.Organization.objects.filter(code=code).exists():
            raise forms.ValidationError(
                "An organization already exists with this code."
            )

        return code


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
        model=models.Organization,
        form=OrganizationWizardForm,
        weight=200,
    )
)


class CategoryWizardForm(BaseWizardForm):
    """
    This form is used by the wizard that creates a new category page.
    A related Category model is created for each category page.
    """

    model = models.Category

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
        except models.Category.DoesNotExist:
            return super().parent_page

        return self.page

    def save(self):
        """
        The parent form created the page.
        This method creates the associated category page extension.
        """
        page = super().save()
        models.Category.objects.create(extended_object=page)
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
        model=models.Category,
        form=CategoryWizardForm,
        weight=200,
    )
)


class BlogPostWizardForm(BaseWizardForm):
    """
    This form is used by the wizard that creates a new blog post
    A related blogpost model is created for each blog post
    """

    model = models.BlogPost

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
        models.BlogPost.objects.create(extended_object=page)
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
        model=models.BlogPost,
        form=BlogPostWizardForm,
        weight=200,
    )
)


class PersonWizardForm(BaseWizardForm):
    """
    This form is used by the wizard that creates a new person page.
    A related Person model is created for each person page.
    """

    model = models.Person

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
        models.Person.objects.create(extended_object=page)
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
        model=models.Person,
        form=PersonWizardForm,
        weight=200,
    )
)


class ProgramWizardForm(BaseWizardForm):
    """
    This form is used by the wizard that creates a new program
    A related program model is created for each program
    """

    model = models.Program

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
        models.Program.objects.create(extended_object=page)
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
        model=models.Program,
        form=ProgramWizardForm,
        weight=200,
    )
)
