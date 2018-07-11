"""
CMS Wizard to add a course page
"""
from django import forms
from django.utils.translation import ugettext_lazy as _

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
    active_session = forms.CharField(
        max_length=200,
        empty_value=None,
        required=False,
        widget=forms.TextInput(),
        label=_("Course key"),
        help_text=_("Course key of the active session"),
    )

    model = Course

    def clean_active_session(self):
        """
        Ensure that a course does not already exist with this active session key.
        """

        if (
            self.cleaned_data.get("active_session")
            # pylint: disable=no-member
            and Course.objects.filter(
                active_session=self.cleaned_data["active_session"]
            ).exists()
        ):
            raise forms.ValidationError(
                _("A course with this active session already exists")
            )

        return self.cleaned_data["active_session"]

    def save(self):
        """
        The parent form created the page.
        This method creates the associated course page extension.
        """
        page = super().save()
        Course.objects.create(
            extended_object=page,
            organization_main=self.cleaned_data["organization"],
            active_session=self.cleaned_data["active_session"],
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
