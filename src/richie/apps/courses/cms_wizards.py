"""
CMS Wizard to add a course page
"""
from django import forms
from django.core import validators
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
from cms.models import Page, PagePermission
from cms.utils.page_permissions import user_can_add_page, user_can_add_subpage
from cms.wizards.forms import BaseFormMixin
from cms.wizards.wizard_base import Wizard
from cms.wizards.wizard_pool import wizard_pool
from filer.models import FolderPermission

from ..core.helpers import get_permissions
from . import defaults
from .helpers import snapshot_course
from .models import (
    BlogPost,
    Category,
    Course,
    CourseRun,
    Organization,
    PageRole,
    Person,
    PersonTitle,
)


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

            has_permission = user_can_add_subpage(self.user, target=self.page)

        else:
            has_permission = user_can_add_page(self.user)

        if not has_permission:
            raise PermissionDenied()

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
        except Page.DoesNotExist:
            raise forms.ValidationError(
                {
                    "slug": [
                        _(
                            "You must first create a parent page and set its `reverse_id` to "
                            "`{reverse}`.".format(reverse=self.model.PAGE["reverse_id"])
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
        # The user should have permission to create a course object
        if not (self.user.is_staff and self.user.has_perm("courses.add_course")):
            raise PermissionDenied()

        return super().clean()

    def save(self):
        """
        The parent form created the page.
        This method creates the associated course page extension.
        If the current page is an organization, the new course should get attached to it via a
        plugin.
        """
        page = super().save()
        course = Course.objects.create(extended_object=page)

        # Create a role for admins of this course (which will create a new user group and a new
        # Filer folder)
        page_role = PageRole.objects.create(page=page, role=defaults.ADMIN)

        # Associate permissions as defined in settings:
        # - Create Django permissions
        page_role.group.permissions.set(
            get_permissions(defaults.COURSE_ADMIN_ROLE.get("django_permissions", []))
        )

        # - Create DjangoCMS page permissions
        PagePermission.objects.create(
            group_id=page_role.group_id,
            page=page,
            **defaults.COURSE_ADMIN_ROLE.get("course_page_permissions", {}),
        )

        # - Create the Django Filer folder permissions
        FolderPermission.objects.create(
            folder_id=page_role.folder_id,
            group_id=page_role.group_id,
            **defaults.COURSE_ADMIN_ROLE.get("course_folder_permissions", {}),
        )

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

            # Create page permissions on the course page for the admin group of the organization
            try:
                page_role = PageRole.objects.only("group").get(
                    page=self.page, role=defaults.ADMIN
                )
            except PageRole.DoesNotExist:
                pass
            else:
                # - Create DjangoCMS page permissions
                PagePermission.objects.create(
                    group_id=page_role.group_id,
                    page_id=course.extended_object_id,
                    **defaults.ORGANIZATION_ADMIN_ROLE.get(
                        "courses_page_permissions", {}
                    ),
                )

                # - Create the Django Filer folder permissions
                FolderPermission.objects.create(
                    folder_id=page_role.folder_id,
                    group_id=page_role.group_id,
                    **defaults.ORGANIZATION_ADMIN_ROLE.get(
                        "courses_folder_permissions", {}
                    ),
                )

        return page


class CourseWizard(Wizard):
    """Inherit from Wizard because each wizard must have its own Python class."""

    def user_has_add_permission(self, user, **kwargs):
        """
        Returns: True if the user has the permission to add course objects, False otherwise.
        """
        return user.has_perm("courses.add_course") and super().user_has_add_permission(
            user, **kwargs
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

    @property
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
        CourseRun.objects.create(extended_object=page, languages=[get_language()])
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
        It also creates a new role with:
          - a user group to handle permissions for admins of this organization,
          - a folder in Django Filer to store images related to this organization,
          - all necessary permissions.
        """
        page = super().save()
        Organization.objects.create(extended_object=page)

        # Create a role for admins of this organization (which will create a new user group and
        # a new Filer folder)
        page_role = PageRole.objects.create(page=page, role=defaults.ADMIN)

        # Associate permissions as defined in settings:
        # - Create Django permissions
        page_role.group.permissions.set(
            get_permissions(
                defaults.ORGANIZATION_ADMIN_ROLE.get("django_permissions", [])
            )
        )

        # - Create DjangoCMS page permissions
        PagePermission.objects.create(
            group_id=page_role.group_id,
            page=page,
            **defaults.ORGANIZATION_ADMIN_ROLE.get("organization_page_permissions", {}),
        )

        # - Create the Django Filer folder permissions
        FolderPermission.objects.create(
            folder_id=page_role.folder_id,
            group_id=page_role.group_id,
            **defaults.ORGANIZATION_ADMIN_ROLE.get(
                "organization_folder_permissions", {}
            ),
        )

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
        Person.objects.create(
            extended_object=page,
            person_title=self.cleaned_data["person_title"],
            first_name=self.cleaned_data["first_name"],
            last_name=self.cleaned_data["last_name"],
        )
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
