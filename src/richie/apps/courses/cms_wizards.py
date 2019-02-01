"""
CMS Wizard to add a course page
"""
from django import forms
from django.conf import settings
from django.utils.functional import cached_property
from django.utils.translation import get_language
from django.utils.translation import ugettext_lazy as _

from cms.api import add_plugin
from cms.wizards.wizard_base import Wizard
from cms.wizards.wizard_pool import wizard_pool

from richie.apps.persons.cms_wizards import BaseWizardForm

from .models import Category, Course, CourseRun, Organization


class CourseWizardForm(BaseWizardForm):
    """
    This form is used by the wizard that creates a new course page.
    A related Course model is created for each course page.
    """

    organization = forms.ModelChoiceField(
        required=True,
        queryset=Organization.objects.filter(extended_object__publisher_is_draft=True),
        label=_("Organization"),
        help_text=_("The organization in charge of this course"),
    )

    model = Course

    def save(self):
        """
        The parent form created the page.
        This method creates the associated course page extension.
        """
        page = super().save()
        course = Course.objects.create(extended_object=page)
        # Add a plugin for the organization

        placeholder = course.extended_object.placeholders.get(
            slot="course_organizations"
        )
        add_plugin(
            language=get_language(),
            placeholder=placeholder,
            plugin_type="OrganizationPlugin",
            **{"page": self.cleaned_data["organization"].extended_object},
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

    course = forms.ModelChoiceField(
        required=True,
        queryset=Course.objects.filter(
            extended_object__publisher_is_draft=True,
            # Only list the top level courses (not the snapshots)
            extended_object__node__parent__cms_pages__course__isnull=True,
        ).distinct(),
        label=_("Course"),
        help_text=_("The course that this course run describes."),
    )
    languages = forms.MultipleChoiceField(
        required=True,
        label=_("Languages"),
        choices=settings.ALL_LANGUAGES,
        help_text=_(
            "Select all the languages in which the course content is available."
        ),
    )
    resource_link = forms.URLField(label=_("Resource link"), required=False)

    model = CourseRun

    @cached_property
    def parent_page(self):
        """
        The parent page of a course run is the related course.
        """
        course = self.cleaned_data.get("course")
        return course.extended_object if course else None

    def save(self):
        """
        The parent form created the page.
        This method creates the associated course run page extension.
        """
        page = super().save()
        CourseRun.objects.create(
            extended_object=page,
            resource_link=self.cleaned_data["resource_link"],
            languages=self.cleaned_data["languages"],
        )
        return page


class CourseRunWizard(Wizard):
    """Inherit from Wizard because each wizard must have its own Python class."""


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
