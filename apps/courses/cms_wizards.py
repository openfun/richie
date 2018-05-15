"""
CMS Wizard to add a course page
"""
from django import forms
from django.template.defaultfilters import slugify
from django.utils.translation import get_language, ugettext_lazy as _

from cms.api import create_page
from cms.forms.wizards import SlugWidget
from cms.models import Page
from cms.wizards.wizard_base import Wizard
from cms.wizards.wizard_pool import wizard_pool

from apps.organizations.models import Organization

from .models import Course, Subject


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

        return cleaned_data

    def clean_slug(self):
        """
        First check that a parent page exists under which we can create the new page,
        then check that the length of the slug is compatible with this parent page:
        a page `path` is limited to 255 chars, therefore the course page slug should
        always be shorter than (255 - length of parent page path - 1 character for the "/")
        """
        parent_page = Page.objects.filter(
            reverse_id=self.model.ROOT_REVERSE_ID, publisher_is_draft=True
        ).first()
        if not parent_page:
            raise forms.ValidationError(
                _(
                    "You must first create a parent page and set its `reverse_id` to "
                    "`{reverse}`.".format(reverse=self.model.ROOT_REVERSE_ID)
                )
            )
        total_size = len(parent_page.get_slug()) + 1 + len(self.cleaned_data["slug"])
        if total_size > 255:
            raise forms.ValidationError(
                _(
                    "This slug is too long. The length of the path built by prepending the slug "
                    "of the parent page would be {:d} characters long and it should be less "
                    "than 255".format(total_size)
                )
            )
        return self.cleaned_data["slug"]

    def save(self):
        """
        Create the page with "title" and "slug"
        """
        # We checked in the "clean" method that the parent page exists. Let's retrieve it:
        parent = Page.objects.get(
            reverse_id=self.model.ROOT_REVERSE_ID, publisher_is_draft=True
        )

        # Create the CMS page for the subject
        return create_page(
            title=self.cleaned_data["title"],
            slug=self.cleaned_data["slug"],
            language=get_language(),
            parent=parent,
            template=self.model.TEMPLATE_DETAIL,
            published=False,  # The creation wizard should not publish the page
        )


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
            main_organization=self.cleaned_data["organization"],
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
