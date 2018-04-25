"""
Organizations application tests
"""
from django.http import Http404

from cms.api import create_page
from cms.models import Page
from cms.test_utils.testcases import CMSTestCase

from ..cms_wizards import OrganizationForm
from ..factories import OrganizationFactory
from ..models import ORGANIZATIONS_PAGE_REVERSE


class CMSWizardTest(CMSTestCase):
    """Organization tests"""

    def _create_organizations_page(self):  # pylint: disable = R0201
        # create basic page structure for organizations
        organization_page = create_page(
            title="Organisations",
            slug=ORGANIZATIONS_PAGE_REVERSE,
            template='richie/fullwidth.html',
            language='fr',
            in_navigation=True,
            reverse_id=ORGANIZATIONS_PAGE_REVERSE,
            published=True,)
        organization_page.set_as_homepage()

    def test_wizard_existing_organization(self):
        """ Create CMS Organization page for given Oragnization
        """
        self._create_organizations_page()
        organization = OrganizationFactory(name="FUN", code='fun')
        form = OrganizationForm(data={'organization': organization.code})
        self.assertTrue(form.is_valid())
        form.save()
        # Page is created as draft
        self.assertTrue(Page.objects.filter(reverse_id='fun').drafts().exists())

    def test_fails_if_no_oragnizations_page(self):
        """ We should not be able to create an CMS Organization Page if
            parent organization list does not exist
        """
        organization = OrganizationFactory(name="FUN", code='fun')
        form = OrganizationForm(data={'organization': organization.code})
        self.assertTrue(form.is_valid())
        with self.assertRaises(Http404):
            form.save()
