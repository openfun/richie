"""
Slider plugin tests
"""

from django.db import IntegrityError, transaction

from cms.api import add_plugin
from cms.models import Placeholder

from richie.apps.core.tests.utils import CMSPluginTestCase
from richie.plugins.slider.factories import SlideItemFactory, SliderFactory
from richie.plugins.slider.models import SlideItem, Slider


class SliderCMSPluginsTestCase(CMSPluginTestCase):
    """Large banner plugin tests case"""

    @transaction.atomic
    def test_cms_plugins_slider_title_required(self):
        """
        A "title" is required when instantiating a slider.
        """
        with self.assertRaises(IntegrityError) as cm:
            SliderFactory(title=None)
        self.assertTrue(
            (
                'null value in column "title" of relation "slider_slider"'
                " violates not-null constraint"
            )
            in str(cm.exception)
            or "Column 'title' cannot be null" in str(cm.exception)
        )

    @transaction.atomic
    def test_cms_plugins_slide_image_required(self):
        """
        A "title" is required when instantiating a slide item
        """
        with self.assertRaises(IntegrityError) as cm:
            SlideItemFactory(title=None)
        self.assertTrue(
            (
                'null value in column "title" of relation "slider_slideitem"'
                " violates not-null constraint"
            )
            in str(cm.exception)
            or "Column 'title' cannot be null" in str(cm.exception)
        )

    def test_cms_plugins_slider_create_success(self):
        """
        Slider and slide item objects creation success
        """
        slider = SliderFactory(title="Foo")
        self.assertEqual("Foo", slider.title)
        self.assertEqual(1, Slider.objects.all().count())

        slide = SlideItemFactory(title="Bar")
        self.assertEqual("Bar", slide.title)
        self.assertEqual(1, SlideItem.objects.all().count())

    @transaction.atomic
    def test_cms_plugins_slider_context_and_html(self):
        """
        Instanciating this plugin with an instance should populate the context
        and render in the template.
        """
        placeholder = Placeholder.objects.create(slot="test")

        slider = SliderFactory()
        model_instance = add_plugin(
            placeholder,
            plugin_type="SliderPlugin",
            language="en",
            title=slider.title,
        )

        # List of built item field values to use in 'add_plugin'
        fields_list = [
            "title",
            "image",
            "content",
            "link_url",
        ]

        # Add some slides
        slide_foo = SlideItemFactory(title="Foo")
        add_plugin(
            placeholder,
            plugin_type="SlideItemPlugin",
            language="en",
            target=model_instance,
            **{field: getattr(slide_foo, field) for field in fields_list},
        )
        slide_bar = SlideItemFactory(title="Bar")
        add_plugin(
            placeholder,
            plugin_type="SlideItemPlugin",
            language="en",
            target=model_instance,
            **{field: getattr(slide_bar, field) for field in fields_list},
        )

        # Template context
        context = self.get_practical_plugin_context()

        # Get generated html for slider title
        html = context["cms_content_renderer"].render_placeholder(
            placeholder, context=context, language="en"
        )

        # Check expected slide property attributes
        element_pattern = (
            '<div id="{container_id}"'
            'class="richie-react richie-react--slider"'
            'data-props-source="#{payload_id}">'
        )
        self.assertInHTML(
            element_pattern.format(
                container_id=model_instance.front_identifier,
                payload_id=model_instance.payload_identifier,
            ),
            html,
        )

        # Check expected slide payload is there
        script_pattern = '<script id="{payload_id}" type="application/json">'
        self.assertIn(
            script_pattern.format(
                payload_id=model_instance.payload_identifier,
            ),
            html,
        )
