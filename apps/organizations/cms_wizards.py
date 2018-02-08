"""
CMS Wizard to add an organization page.
Wizard only allow page creation for existing organization
"""
from django import forms
from django.http import Http404
from django.utils.translation import ugettext_lazy as _

from cms.api import create_page
from cms.forms.wizards import SlugWidget
from cms.models import Page
from cms.wizards.wizard_base import Wizard
from cms.wizards.wizard_pool import wizard_pool

from .models import Organization, OrganizationPage, ORGANIZATIONS_PAGE_REVERSE


class OrganizationForm(forms.ModelForm):
    """Organization model form"""

    organization = forms.ChoiceField(choices=[])
    title = forms.CharField(
        max_length=255,
        required=False,
        widget=forms.TextInput(),
        label=_("Page title"),
        help_text=_("French title of the page (leave blank for Oganization name)"),
    )
    slug = forms.CharField(
        max_length=255,
        required=False,
        widget=forms.TextInput(),
        label=_("Page slug"),
        help_text=_("French slug of the page (leave blank for automatic slug from title)"),
    )

    class Meta:
        model = OrganizationPage
        exclude = []

    def __init__(self, *args, **kwargs):
        """Populate oganization list with available organizations"""

        super(OrganizationForm, self).__init__(*args, **kwargs)
        organizations = Organization.objects.filter(organizationpage__isnull=True)
        if organizations:
            choices = [['', _("Select organization")]]
            for organization in organizations:
                choices += [(organization.code, str(organization))]
        else:
            choices = [['', _("No available organizations")]]
            self.fields['organization'].disabled = True
        self.fields['organization'].choices = choices
        self.fields['slug'].widget = SlugWidget()

    def clean(self):
        cleaned_data = super(OrganizationForm, self).clean()
        if 'organization' not in cleaned_data:
            return cleaned_data

        organization = Organization.objects.get(code=cleaned_data['organization'])
        cleaned_data['organization'] = organization
        if not cleaned_data['slug']:
            cleaned_data['slug'] = cleaned_data['organization'].code
        if not cleaned_data['title']:
            cleaned_data['title'] = cleaned_data['organization'].name
        return cleaned_data

    def save(self, commit=True):
        try:  # retrieve correct parent page
            organizations_page = Page.objects.get(
                reverse_id=ORGANIZATIONS_PAGE_REVERSE, publisher_is_draft=True)
        except (IndexError, Page.DoesNotExist):
            raise Http404("You can't create Organization Page when no organizations \
                list parent page exists")
        page = create_page(
            title=self.cleaned_data['title'],
            slug=self.cleaned_data['slug'],
            language='fr',
            parent=organizations_page,
            template='organizations/cms/organization.html',
            reverse_id=self.cleaned_data['slug'],
            published=False,  # Wizard do not publish the page
            )
        organization = self.cleaned_data['organization']
        organization_page = OrganizationPage.objects.create(
            organization=organization, extended_object=page)

        return organization_page


class OrganizationWizard(Wizard):
    """Organization wizard"""

    def get_success_url(self, obj, **kwargs):
        return obj.get_absolute_url()

    def get_description(self, **kwargs):
        return _("Create new Organization page")


wizard_pool.register(
    OrganizationWizard(
        title=_("New Organization page"),
        weight=200,
        form=OrganizationForm,
        description=_("Create new Organization page"),
    )
)
