"""Section plugin list template test suite."""
from cms.api import add_plugin
from cms.models import Placeholder

from richie.apps.core.tests.utils import CMSPluginTestCase
from richie.plugins.section.cms_plugins import SectionPlugin


# pylint: disable=too-many-ancestors
class ListTemplatesTestCase(CMSPluginTestCase):
    """Section plugin list template test case"""

    def test_templates_section_unordered_list_flat(self):
        """The Section plugin can be used to render a flat unordered list."""
        context = self.get_practical_plugin_context()
        placeholder = Placeholder.objects.create(slot="footer")

        parent = add_plugin(
            placeholder,
            SectionPlugin,
            "en",
            title="My list",
            template="richie/section/section_list.html",
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
            f"""
            <label class="section-label" for="footer-menu-{parent.id:d}">My list</label>
            <ul id="footer-menu-{parent.id:d}" class="section-list">
            <li class="section-list__item">
            <a href="http://www.example.com/1">Example 1</a>
            </li>
            <li class="section-list__item">
            <a href="http://www.example.com/2">Example 2</a>
            </li>
            </ul>
            """,
        )

    def test_templates_section_unordered_list_nested(self):
        """The Section plugin can be used to render a nested unordered list."""
        context = self.get_practical_plugin_context()
        placeholder = Placeholder.objects.create(slot="footer")

        container = add_plugin(
            placeholder,
            SectionPlugin,
            "en",
            template="richie/section/section_list.html",
        )
        # A first list with a title as label
        parent1 = add_plugin(
            placeholder,
            SectionPlugin,
            "en",
            target=container,
            title="My list 1",
            template="richie/section/section_list.html",
        )
        # A second list without title
        parent2 = add_plugin(
            placeholder,
            SectionPlugin,
            "en",
            target=container,
            template="richie/section/section_list.html",
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
            f"""
            <ul id="footer-menu-{container.id:d}" class="section-list">
            <li class="section-list__item">
            <label class="section-label" for="footer-menu-{parent1.id:d}">My list 1</label>
            <ul id="footer-menu-{parent1.id:d}" class="section-list">
            <li class="section-list__item"><a href="http://www.example.com/1">Example 1</a></li>
            <li class="section-list__item"><a href="http://www.example.com/2">Example 2</a></li>
            </ul>
            </li>
            <li class="section-list__item">
            <ul id="footer-menu-{parent2.id:d}" class="section-list">
            <li class="section-list__item"><a href="http://www.example.com/1">Example 1</a></li>
            <li class="section-list__item"><a href="http://www.example.com/2">Example 2</a></li>
            </ul>
            </li>
            </ul>
            """,
        )
