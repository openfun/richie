from django import forms
from django.utils.text import slugify
from django.utils.translation import ugettext_lazy as _
from django.contrib.sites.models import Site
from django.http import Http404

from cms.models import Page
from cms.wizards.wizard_pool import wizard_pool
from cms.wizards.wizard_base import Wizard
from cms.api import add_plugin, create_page

from .models import OrganizationPage, get_organizations, get_organization_data


class OrganizationForm(forms.ModelForm):

    class Meta:
        model = OrganizationPage
        exclude = []

    def __init__(self, *args, **kwargs):
        """ Populate oganization_key list with available organizations
        """
        super(OrganizationForm, self).__init__(*args, **kwargs)

        # Retrieve existing organizations from API
        organizations = get_organizations()
        # Get Organizations which already have a CMS page
        existing = OrganizationPage.objects.values_list('organization_key', flat=True)
        # Filter
        availables = filter(lambda org: org['id'] not in existing, organizations)
        # Order by name
        ordered = sorted(availables, key=lambda org: org['name'])
        # Build choice list
        choices = [(organization['id'], "{name} ({code})".format(
            **organization)) for organization in ordered]
        self.fields['organization_key'].choices = choices

    organization_key = forms.ChoiceField(required=True, choices=[])
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

    def clean(self):
        """ Create title from API and slug from title if left blank by user
        """
        detail = get_organization_data(self.cleaned_data['organization_key'])
        if not self.cleaned_data['title']:
            self.cleaned_data['title'] = detail['name']
        if not self.cleaned_data['slug']:
            slugify(self.cleaned_data['title'])
        return self.cleaned_data

    def save(self, *args, **kwargs):
        site = Site.objects.get(id=1)
        try:  # retrieve correct parent page
            organizations_page = Page.objects.get(reverse_id='organizations_fr', languages='fr')
        except (IndexError, Page.DoesNotExist) as e:
            raise Http404("You can't create Organization Page when no organizations \
                list parent page exists")

        page = create_page(
            title=self.cleaned_data['title'],
            slug=self.cleaned_data['slug'],
            language='fr',
            parent=organizations_page,
            template='organizations/cms/organization.html',
            reverse_id=self.cleaned_data['slug'],
            in_navigation=True,
            published=True,
            site=site,
        )
        organization_page = OrganizationPage(
            organization_key=self.cleaned_data['organization_key'],
            extended_object=page,
        )
        organization_page.save()
        placeholder = page.placeholders.get(slot='maincontent')

        add_plugin(
            placeholder=placeholder,
            plugin_type='TextPlugin',
            language='fr',
            body='Le Lorem ipsum...',
        )
        return organization_page


class OrganizationWizard(Wizard):

    def get_success_url(self, obj, **kwargs):
        return obj.get_absolute_url()


organization_wizard = OrganizationWizard(
    title=_("New Organization page"),
    weight=200,
    form=OrganizationForm,
    description=_("Create a new Organization page"),
)
wizard_pool.register(organization_wizard)
