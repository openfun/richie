"""
CMS Wizard to add a course page
"""
from django import forms
from django.utils import translation
from django.utils.translation import ugettext_lazy as _

from cms.api import add_plugin
from cms.wizards.wizard_base import Wizard
from cms.wizards.wizard_pool import wizard_pool

from richie.apps.persons.cms_wizards import BaseWizardForm

from .models import Course, Organization, Subject


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
            language=translation.get_language(),
            placeholder=placeholder,
            plugin_type="OrganizationPlugin",
            **{"page": self.cleaned_data["organization"].extended_object},
        )

        return page


class CourseWizard(Wizard):
    """Inherit from Wizard because each wizard must have its own Python class."""

    pass


wizard_pool.register(
    CourseWizard(
        title=_("New course page"),
        description=_("Create a new course page"),
        model=Course,
        form=CourseWizardForm,
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

    pass


wizard_pool.register(
    OrganizationWizard(
        title=_("New Organization page"),
        description=_("Create a new Organization page"),
        model=Organization,
        form=OrganizationWizardForm,
        weight=200,
    )
)


class SubjectWizardForm(BaseWizardForm):
    """
    This form is used by the wizard that creates a new subject page.
    A related Subject model is created for each subject page.
    """

    model = Subject

    def save(self):
        """
        The parent form created the page.
        This method creates the associated subject page extension.
        """
        page = super().save()
        Subject.objects.create(extended_object=page)
        return page


class SubjectWizard(Wizard):
    """Inherit from Wizard because each wizard must have its own Python class."""

    pass


wizard_pool.register(
    SubjectWizard(
        title=_("New subject page"),
        description=_("Create a new subject page"),
        model=Subject,
        form=SubjectWizardForm,
        weight=200,
    )
)
