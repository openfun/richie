"""Section plugin default template test suite."""

from cms.api import add_plugin
from cms.models import Placeholder

from richie.apps.core.tests.utils import CMSPluginTestCase
from richie.plugins.section.cms_plugins import SectionPlugin


# pylint: disable=too-many-ancestors
class DefaultTemplatesTestCase(CMSPluginTestCase):
    """Section plugin default template test case"""

    def test_templates_section_default_flat(self):
        """The Section plugin can be used to render a flat section."""
        context = self.get_practical_plugin_context()
        placeholder = Placeholder.objects.create(slot="footer")

        parent = add_plugin(
            placeholder,
            SectionPlugin,
            "en",
            title="My section",
            template="richie/section/section.html",
        )
        add_plugin(
            placeholder,
            plugin_type="LinkPlugin",
            language="en",
            external_link="http://www.example.com/1",
            name="Example 1",
            target=parent,
        )
        add_plugin(
            placeholder,
            plugin_type="LinkPlugin",
            language="en",
            external_link="http://www.example.com/2",
            name="Example 2",
            target=parent,
        )

        html = context["cms_content_renderer"].render_placeholder(
            placeholder, context=context, language="en"
        )
        self.assertHTMLEqual(
            html,
            """
            <section class="section ">
            <div class="section__row">
            <h2 class="section__title">My section</h2>
            <div class="section__items">
            <a href="http://www.example.com/1">Example 1</a>
            <a href="http://www.example.com/2">Example 2</a>
            </div>
            </div>
            </section>
            """,
        )

    def test_templates_section_title_safe(self):
        """
        The section title should be safe to pass HTML in default template and all
        variant inheriters (except the 'tile' one). This is required since title input
        is a CKEditor which make some escaping on special characters turning them to
        HTML entities like "&eacute;" where '&' (along '<', '>' and others) will be
        escaped by Django template renderer.
        """
        context = self.get_practical_plugin_context()
        placeholder = Placeholder.objects.create(slot="footer")

        add_plugin(
            placeholder,
            SectionPlugin,
            "en",
            title="<b>Titre &eacute;l&eacute;ctrique</b>",
            template="richie/section/section.html",
        )

        html = context["cms_content_renderer"].render_placeholder(
            placeholder, context=context, language="en"
        )

        self.assertHTMLEqual(
            html,
            """
            <section class="section ">
            <div class="section__row">
            <h2 class="section__title"><b>Titre &eacute;l&eacute;ctrique</b></h2>
            <div class="section__items"></div>
            </div>
            </section>
            """,
        )

    def test_templates_section_tile_title_safe(self):
        """
        The section title should be safe to pass HTML in tile variant template alike
        default section template.
        """
        context = self.get_practical_plugin_context()
        placeholder = Placeholder.objects.create(slot="footer")

        add_plugin(
            placeholder,
            SectionPlugin,
            "en",
            title="<b>Titre &eacute;l&eacute;ctrique</b>",
            template="richie/section/section_tiles.html",
        )

        html = context["cms_content_renderer"].render_placeholder(
            placeholder, context=context, language="en"
        )

        self.assertHTMLEqual(
            html,
            """
            <div class="section-tiles ">
            <div class="section-tiles__row">
            <h2 class="section-tiles__title"><b>Titre &eacute;l&eacute;ctrique</b></h2>
            <div class="section-tiles__items"></div>
            </div>
            </div>
            """,
        )

    def test_templates_section_default_nested(self):
        """The Section plugin can be used to render nested sections."""
        context = self.get_practical_plugin_context()
        placeholder = Placeholder.objects.create(slot="footer")

        container = add_plugin(
            placeholder,
            SectionPlugin,
            "en",
            template="richie/section/section.html",
        )
        # A first section with a title as label
        parent1 = add_plugin(
            placeholder,
            SectionPlugin,
            "en",
            target=container,
            title="My section 1",
            template="richie/section/section.html",
        )
        # A second section without title
        parent2 = add_plugin(
            placeholder,
            SectionPlugin,
            "en",
            target=container,
            template="richie/section/section.html",
        )

        for parent in [parent1, parent2]:
            add_plugin(
                placeholder,
                plugin_type="LinkPlugin",
                language="en",
                external_link="http://www.example.com/1",
                name="Example 1",
                target=parent,
            )
            add_plugin(
                placeholder,
                plugin_type="LinkPlugin",
                language="en",
                external_link="http://www.example.com/2",
                name="Example 2",
                target=parent,
            )

        html = context["cms_content_renderer"].render_placeholder(
            placeholder, context=context, language="en"
        )
        self.assertHTMLEqual(
            html,
            """
            <section class="section ">
            <div class="section__row">
            <div class="section__items">
            <section class="section ">
            <div class="section__row">
            <h3 class="section__title">My section 1</h3>
            <div class="section__items">
            <a href="http://www.example.com/1">Example 1</a>
            <a href="http://www.example.com/2">Example 2</a>
            </div>
            </div>
            </section>
            <section class="section ">
            <div class="section__row">
            <div class="section__items">
            <a href="http://www.example.com/1">Example 1</a>
            <a href="http://www.example.com/2">Example 2</a>
            </div>
            </div>
            </section>
            </div>
            </div>
            </section>
            """,
        )
