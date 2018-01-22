
import re
import sys

from django.core.urlresolvers import clear_url_caches, reverse
from django.conf import settings
from django.db import IntegrityError
from django.http import HttpRequest
from django.test import TestCase
from django.test.client import RequestFactory
from django.template.loader import render_to_string

from cms.api import add_plugin, create_page
from cms.appresolver import clear_app_resolvers
from cms.test_utils.testcases import CMSTestCase
from cms.models import Placeholder
from cms.plugin_rendering import ContentRenderer

from .cms_apps import OrganizationApp
from .cms_plugins import OrganizationListPlugin
from .cms_wizards import OrganizationWizard
from .factories import OrganizationFactory, OrganizationListFactory
from .forms import OrganizationForm
from .models import Organization
from .views import OrganizationDetailView

from django.contrib.auth.models import AnonymousUser, User

class OrganizationTests(CMSTestCase):
    def create_page(self):
        """
        Create a main page and a child page to put an apphook
        on the child
        """

        # Create the main main
        main_page = create_page(
            'main',
            'fullwidth.html',
            'en',
            published = True,
            )
        main_page.publish('en')

        # Create the child page with an apphook
        child = create_page(
            'test_page',
            'fullwidth.html',
            'en',
            parent = main_page,
            published = True,
            apphook = OrganizationApp,
            apphook_namespace = "OrganizationApp",
            navigation_extenders = 'OrganizationMenu'
            )
        child.publish('en')
        return child

    def test_list_from_apphook(self):
        """
        Instanciating a page, check his status code
        from his url and check the rendered template.
        """

        # Create a main page and a child page to put an apphook
        # on the child
        page = self.create_page()

        # Create random values for parameters with a factory
        # except for is_detail_page_enabled and is_obsolete
        organization = OrganizationFactory()
        organization.is_detail_page_enabled = True
        organization.is_obsolete = False
        organization.save()

        # Get a response from the Organization list page url
        response = self.client.get(page.get_absolute_url())

        # Check the response status code
        self.assertEqual(response.status_code, 200)

        # Get the rendered html
        expected_html = render_to_string(
            'organization/organization_list.html', response.context[0])

        # Check that all expected elements are in the html
        self.assertIn('<img src="{:s}"'.format(
            organization.get_logo_thumbnail()), expected_html)
    
    def test_organization_url_and_html(self):
        """
        Instanciating an organization, check his status code from his url
        and check the rendered template.
        """
        
        # Create a main page and a child page to put an apphook
        # on the child
        page = self.create_page()

        # Create random values for parameters with a factory
        # except for is_detail_page_enabled and is_obsolete
        organization = OrganizationFactory()
        organization.is_detail_page_enabled = True
        organization.is_obsolete = False
        organization.save()

        # Get a response from the Organization url
        response = self.client.get(organization.get_absolute_url())

        # Check the response status code
        self.assertEqual(response.status_code, 200)

        # Get the rendered html
        expected_html = render_to_string(
            'organization/detail.html', response.context[0])
        
        # Check that all expected elements are in the html
        self.assertIn('<h1>{:s}</h1>'.format(organization.name), expected_html)
        self.assertIn('<img src="{:s}"'.format(
            organization.get_logo_thumbnail()), expected_html)
        self.assertIn('<img src="{:s}"'.format(
            organization.get_banner_thumbnail()), expected_html)
        self.assertIn('<p>{:s}</p>'.format(
            organization.description), expected_html)

    def check_nb_organization_displayed(self, html, organization_list, limit=None):
        """
        Check if a correct number of organization are displayed in the html template
        """

        #Get the number of organization displayed in the html template
        nb_organization_html = html.count('<div class="university-logo center-block">')

        #Calculate how much organization in plugin
        nb_organization_plugin = 0
        for organization in organization_list:
            if organization.is_detail_page_enabled == True and organization.is_obsolete == False:
                nb_organization_plugin += 1
        
        #Check with a limit
        if limit is not None :
            # organization number displayed in the template can not be greater than limit
            if limit < nb_organization_html:
                self.assertTrue(False, "limit < nb_organization_html")
            if limit > nb_organization_html and nb_organization_html < nb_organization_plugin:
                self.assertTrue(False, "limit > nb_organization_html")
        #check without limit
        else:
            # organization number displayed in the template have to be equal to the
            # organization number in plugin
            if nb_organization_html == nb_organization_plugin:
                self.assertTrue(True)
            else:
                self.assertTrue(
                    False,
                    "organization number in html and organization number in plugin are not equal"
                    )
        self.assertTrue(True)

    def test_organization_list_limit_context_and_html(self):
        """
        Instanciating this plugin with an instance should populate the context
        and render in the template.
        This will check if organization list is correctly displayed with a
        correct limit and if "is_detail_page_enabled" and "is_obsolete" properties
        of university are set to True and False.
        """

        # Create a main page and a child page to put an apphook
        # on the child
        page = self.create_page()

        # Create 10 organizations with random values
        organizations_list = OrganizationFactory.create_batch(10)

        placeholder = Placeholder.objects.create(slot='test')

        # Create random values for parameters with a factory
        organization_list = OrganizationListFactory()
        fields_list = ['limit']

        model_instance = add_plugin(
            placeholder,
            OrganizationListPlugin,
            'en',
            **{field: getattr(organization_list, field) for field in fields_list}
        )
        plugin_instance = model_instance.get_plugin_class_instance()
        context = plugin_instance.render({}, model_instance, None)

        # Check if "instance" is in context
        self.assertIn('instance', context)

        # Check if parameters, generated by the factory, are correctly set in "instance"
        # of context
        self.assertEqual(context['instance'].limit, organization_list.limit)

        # Get the generated html
        renderer = ContentRenderer(request=RequestFactory())
        html = renderer.render_plugin(model_instance, {})

        # Check if organizations number displayed is correct
        self.check_nb_organization_displayed(
            html, context['instance'].get_organizations(), context['instance'].limit)
