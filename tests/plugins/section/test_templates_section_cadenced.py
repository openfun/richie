"""Section plugin cadenced template test suite."""
from cms.api import add_plugin
from cms.models import Placeholder

from richie.apps.core.tests.utils import CMSPluginTestCase
from richie.plugins.section.cms_plugins import SectionPlugin


# pylint: disable=too-many-ancestors
class CadencedTemplatesTestCase(CMSPluginTestCase):
    """Section plugin cadenced template test case"""

    def test_templates_section_cadenced_flat(self):
        """The Section plugin can be used to render a flat section."""
        context = self.get_practical_plugin_context()
        placeholder = Placeholder.objects.create(slot="footer")

        parent = add_plugin(
            placeholder,
            SectionPlugin,
            "en",
            title="My section",
            template="richie/section/section_cadenced.html",
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
            <div class="section-container-cadenced">
            <section class="section">
            <h2 class="section__title">My section</h2>
            <div class="section__items">
            <a href="http://www.example.com/1">Example 1</a>
            <a href="http://www.example.com/2">Example 2</a>
            </div>
            </section>
            </div>
            """,
        )

    def test_templates_section_cadenced_nested(self):
        """The Section plugin can be used to render nested sections."""
        context = self.get_practical_plugin_context()
        placeholder = Placeholder.objects.create(slot="footer")

        container = add_plugin(
            placeholder,
            SectionPlugin,
            "en",
            template="richie/section/section_cadenced.html",
        )
        # A first section with a title as label
        parent1 = add_plugin(
            placeholder,
            SectionPlugin,
            "en",
            target=container,
            title="My section 1",
            template="richie/section/section_cadenced.html",
        )
        # A second section without title
        parent2 = add_plugin(
            placeholder,
            SectionPlugin,
            "en",
            target=container,
            template="richie/section/section_cadenced.html",
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
            <div class="section-container-cadenced">
            <section class="section">
            <div class="section__items">
            <div class="section-container-cadenced">
            <section class="section">
            <h3 class="section__title">My section 1</h3>
            <div class="section__items">
            <a href="http://www.example.com/1">Example 1</a>
            <a href="http://www.example.com/2">Example 2</a>
            </div>
            </section>
            </div>
            <div class="section-container-cadenced">
            <section class="section">
            <div class="section__items">
            <a href="http://www.example.com/1">Example 1</a>
            <a href="http://www.example.com/2">Example 2</a>
            </div>
            </section>
            </div>
            </div>
            </section>
            </div>
            """,
        )
