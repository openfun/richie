"""
CMS Wizard to add a person page
"""
from django import forms
from django.template.defaultfilters import slugify
from django.utils.translation import get_language
from django.utils.translation import ugettext_lazy as _

from cms.api import create_page
from cms.forms.wizards import SlugWidget
from cms.models import Page
from cms.wizards.wizard_base import Wizard
from cms.wizards.wizard_pool import wizard_pool

from .models import Person, PersonTitle


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
        # pylint: disable=no-member
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

        # Create the CMS page for the person
        return create_page(
            title=self.cleaned_data["title"],
            slug=self.cleaned_data["slug"],
            language=get_language(),
            parent=parent,
            template=self.model.TEMPLATE_DETAIL,
            published=False,  # The creation wizard should not publish the page
        )


class PersonWizardForm(BaseWizardForm):
    """
    This form is used by the wizard that creates a new person page.
    A related Person model is created for each person page.
    """

    person_title = forms.ModelChoiceField(
        required=True,
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

    pass


wizard_pool.register(
    PersonWizard(
        title=_("New person page"),
        description=_("Create a new person page"),
        model=Person,
        form=PersonWizardForm,
        weight=200,
    )
)
