"""
CMS Wizard to add an organization page
Wizard only allow page creation for existing organization
"""
from django import forms
from django.utils.text import slugify
from django.utils.translation import get_language, ugettext_lazy as _

from cms.api import create_page
from cms.forms.wizards import SlugWidget
from cms.models import Page
from cms.wizards.wizard_base import Wizard
from cms.wizards.wizard_pool import wizard_pool

from .models import Organization, OrganizationPage, ORGANIZATIONS_PAGE_REVERSE_ID


class OrganizationWizardForm(forms.Form):
    """
    This form is used by the wizard that creates a new organization page
    A related organization model is created for each organization page
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
        if cleaned_data.get('title') and not cleaned_data.get('slug'):
            cleaned_data['slug'] = slugify(cleaned_data['title'])[:200]

    def clean_title(self):
        """
        Check that the organizations list page exists. Do it in a `clean_title` and not as a
        general error because the wizard page does not display them...
        """
        if not Page.objects.filter(
                reverse_id=ORGANIZATIONS_PAGE_REVERSE_ID,
                publisher_is_draft=True,
        ).exists():
            raise forms.ValidationError(_(
                'You must first create an `organization list` page and set its `reverse_id` to '
                '`organizations`.'
            ))
        # Return the field value
        return self.cleaned_data['title']

    def save(self):
        """
        Create the organization page and its related organization model
        """
        # We checked in the "clean" method that the parent page exists. Let's retrieve it:
        parent = Page.objects.get(
            reverse_id=ORGANIZATIONS_PAGE_REVERSE_ID,
            publisher_is_draft=True,
        )
        # Create the Organization
        organization = Organization.objects.create(name=self.cleaned_data['title'])

        # Create the organization CMS page
        page = create_page(
            title=self.cleaned_data['title'],
            slug=self.cleaned_data['slug'],
            language=get_language(),
            parent=parent,
            template='organizations/cms/organization_detail.html',
            published=False,  # The creation wizard should not publish the page
        )
        # Create the organization page extension
        OrganizationPage.objects.create(
            extended_object=page,
            organization=organization,
        )

        return page


wizard_pool.register(Wizard(
    title=_("New Organization page"),
    description=_("Create a new Organization page"),
    model=Organization,
    form=OrganizationWizardForm,
    weight=200,
))
