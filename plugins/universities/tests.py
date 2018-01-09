
from django.core.urlresolvers import reverse
from django.db import IntegrityError
from django.http import HttpRequest
from django.test import TestCase
from django.test.client import RequestFactory
from django.template.loader import render_to_string
import re

from cms.api import add_plugin, create_page
from cms.models import Placeholder
from cms.plugin_rendering import ContentRenderer

from .cms_plugins import UniversitiesListPlugin, AllUniversitiesListPlugin
from .cms_wizards import UniversityWizard
from .factories import UniversityFactory, UniversitiesListFactory, AllUniversitiesListFactory
from .forms import UniversityForm
from .models import University
from .views import UniversityDetailView, university_detail


class UniversitiesTests(TestCase):
    
    def test_university_url(self):
        """
        Instanciating a university and check his status code from his url
        """

        #Create random values for parameters with a factory
        university = UniversityFactory()

        #Get a response from the university url
        response = self.client.get(university.get_absolute_url())

        #Check the response status code
        self.assertEqual(response.status_code, 302)
    
    def test_university(self):
        """
        Instanciating this plugin with an university instance should populate
        the context and render in the template.
        """

        #Create random values for parameters with a factory
        university = UniversityFactory()

        #Get a response from the university url
        response = self.client.get(university.get_absolute_url())

        #Fill the response context with a university parameter
        response.context['university'] = university

        #Get the rendered html
        expected_html = render_to_string('universities/test-detail.html',
                                            response.context)

        # Check that all expected elements are in the html
        self.assertIn('<h1>{:s}</h1>'.format(university.name), expected_html)
        self.assertIn('<img src="{:s}"'.format(university.get_logo_thumbnail()),
                                                expected_html)
        self.assertIn('<img src="{:s}"'.format(university.get_banner()),
                                                expected_html)
        self.assertIn('<p>{:s}</p>'.format(university.description),
                                                expected_html)
        
    def create_universities_list(self, limit=30):
        """
        Create universities
        """

        universities_list = []
        i=0
        while (i < limit):
            universities_list.append(UniversityFactory())
            i+=1
        return universities_list

    def check_nb_universities_displayed(self, html, universities_list, limit=None):
        """
        Check if a correct number of universities are displayed in the html template
        """

        #Get the number of universitites displayed in the html template
        nb_universities_html = html.count('<div class="university-logo center-block">')

        #Calculate how much universities in plugin
        nb_universities_plugin = 0
        for university in universities_list:
            if university.detail_page_enabled == True and university.is_obsolete == False:
                nb_universities_plugin += 1
        
        #Check with a limit
        if limit is not None :
            # Universities number displayed in the template can not be greater than limit
            if limit < nb_universities_html:
                self.assertTrue(False, "limit < nb_universities_html")
            if limit > nb_universities_html and nb_universities_html < nb_universities_plugin:
                self.assertTrue(False, "limit > nb_universities_html")
        #check without limit
        else:
            # Universities number displayed in the template have to be equal to the
            # universities number in plugin
            if nb_universities_html == nb_universities_plugin:
                self.assertTrue(True)
            else:
                self.assertTrue(False, 
                    "Universities number in html and universities number in plugin are not equal")
        self.assertTrue(True)

    def test_universities_list_limit_context_and_html(self):
        """
        Instanciating this plugin with an instance should populate the context
        and render in the template.
        This will check if universities list is correctly displayed with a
        correct limit and if "detail_page_enabled" and "is_obsolete" properties
        of university are set to True and False.
        """

        placeholder = Placeholder.objects.create(slot='test')

        # Create random values for parameters with a factory
        universities_list = UniversitiesListFactory()
        fields_list = ['limit']

        model_instance = add_plugin(
            placeholder,
            UniversitiesListPlugin,
            'en',
            **{field: getattr(universities_list, field) for field in fields_list}
        )
        plugin_instance = model_instance.get_plugin_class_instance()
        context = plugin_instance.render({}, model_instance, None)
        
        self.create_universities_list()

        # Check if "instance" is in context
        self.assertIn('instance', context)

        # Check if parameters, generated by the factory, are correctly set in "instance"
        # of context
        self.assertEqual(context['instance'].limit, universities_list.limit)

        # Get the generated html
        renderer = ContentRenderer(request=RequestFactory())
        html = renderer.render_plugin(model_instance, {})

        self.check_nb_universities_displayed(html, context['instance'].get_universities(), context['instance'].limit)


    def test_universities_list_context_and_html(self):
        """
        Instanciating this plugin with an instance should populate the context
        and render in the template.
        This will check if all universities are correctly displayed if 
        "detail_page_enabled" and "is_obsolete" properties of university are 
        set to True and False.
        """
        
        placeholder = Placeholder.objects.create(slot='test')

        # Create random values for parameters with a factory
        universities_list = AllUniversitiesListFactory()
        fields_list = ['title', 'description']

        model_instance = add_plugin(
            placeholder,
            AllUniversitiesListPlugin,
            'en',
            **{field: getattr(universities_list, field) for field in fields_list}
        )
        plugin_instance = model_instance.get_plugin_class_instance()
        context = plugin_instance.render({}, model_instance, None)

        self.create_universities_list()


        # Check if "instance" is in context
        self.assertIn('instance', context)

        # Check if parameters, generated by the factory, are correctly set in "instance"
        # of context
        self.assertEqual(context['instance'].title, universities_list.title)
        self.assertEqual(context['instance'].description, universities_list.description)

        # Get the generated html
        renderer = ContentRenderer(request=RequestFactory())
        html = renderer.render_plugin(model_instance, {})

        # Check that all expected elements are in the html
        self.assertIn('<h1>{:s}</h1>'.format(universities_list.title), html)
        self.assertIn('<p>{:s}</p>'.format(universities_list.description), html)

        self.check_nb_universities_displayed(html, universities_list.universities)
