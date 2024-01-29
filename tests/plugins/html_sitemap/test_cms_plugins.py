"""Testing DjangoCMS plugin declaration for Richie's simple picture plugin."""

from django.test.client import RequestFactory

from cms.api import add_plugin
from cms.models import Placeholder, StaticPlaceholder
from cms.plugin_rendering import ContentRenderer

from richie.apps.core.factories import PageFactory, UserFactory
from richie.apps.core.tests.utils import CMSPluginTestCase
from richie.plugins.html_sitemap.cms_plugins import HTMLSitemapPlugin


# pylint: disable=too-many-ancestors
class HTMLSitemapPluginTestCase(CMSPluginTestCase):
    """Test suite for HTMLPluginSitemapPlugin."""

    @staticmethod
    def create_page_tree(parent_kwargs=None):
        """
        Not a test.
        Create a minimal site structure on which to test the sitemap plugin.
        """
        root = PageFactory(title__title="Root")
        parent = PageFactory(
            title__title="Parent", parent=root, **(parent_kwargs or {})
        )
        page = PageFactory(title__title="Uncle", parent=root)
        PageFactory(title__title="Page", parent=parent)
        PageFactory(title__title="Sibling", parent=parent)
        return root, parent, page

    def test_cms_plugins_htmlsitemap_no_children(self):
        """An HTML sitemap plugin without any children should render an empty sitemap."""
        placeholder = Placeholder.objects.create(slot="maincontent")
        model_instance = add_plugin(placeholder, HTMLSitemapPlugin, "en")

        renderer = ContentRenderer(request=RequestFactory())
        html = renderer.render_plugin(model_instance, {})

        self.assertHTMLEqual(html, '<div class="sitemap"></div>')

    def test_cms_plugins_htmlsitemap_no_root_page(self):
        """A sitemap page not targeted to a root page should display the whole site structure."""
        self.create_page_tree()

        page = PageFactory(title__title="Sitemap")
        placeholder = Placeholder.objects.create(slot="maincontent")
        page.placeholders.add(placeholder)

        context = self.get_practical_plugin_context({"current_page": page})
        parent_instance = add_plugin(placeholder, HTMLSitemapPlugin, "en")
        add_plugin(
            placeholder,
            plugin_type="HTMLSitemapPagePlugin",
            language="en",
            target=parent_instance,
        )

        html = context["cms_content_renderer"].render_placeholder(
            placeholder, context=context, language="en"
        )
        self.assertHTMLEqual(
            html,
            """
            <div class="sitemap">
              <ul>
                <li><a href="/en/root/">Root</a>
                  <ul>
                    <li><a href="/en/root/parent/">Parent</a>
                      <ul>
                        <li><a href="/en/root/parent/page/">Page</a></li>
                        <li><a href="/en/root/parent/sibling/">Sibling</a></li>
                      </ul>
                    </li>
                    <li><a href="/en/root/uncle/">Uncle</a></li>
                  </ul>
                </li>
                <li><a href="/en/sitemap/">Sitemap</a></li>
              </ul>
            </div>
            """,
        )

    def test_cms_plugins_htmlsitemap_root_page_include(self):
        """
        A sitemap page targeted to a root page in "include" mode should display the root page and
        its descendants.
        """
        _root, parent_page, _page = self.create_page_tree()

        page = PageFactory(title__title="Sitemap")
        placeholder = Placeholder.objects.create(slot="maincontent")
        page.placeholders.add(placeholder)

        context = self.get_practical_plugin_context({"current_page": page})
        parent_instance = add_plugin(placeholder, HTMLSitemapPlugin, "en")
        add_plugin(
            placeholder,
            plugin_type="HTMLSitemapPagePlugin",
            language="en",
            target=parent_instance,
            root_page=parent_page,
        )

        html = context["cms_content_renderer"].render_placeholder(
            placeholder, context=context, language="en"
        )
        self.assertHTMLEqual(
            html,
            """
            <div class="sitemap">
              <ul>
                <li><a href="/en/root/parent/">Parent</a>
                  <ul>
                    <li><a href="/en/root/parent/page/">Page</a></li>
                    <li><a href="/en/root/parent/sibling/">Sibling</a></li>
                  </ul>
                </li>
              </ul>
            </div>
            """,
        )

    def test_cms_plugins_htmlsitemap_root_page_exclude(self):
        """
        A sitemap page targeted to a root page in "exclude" mode should display the descendants
        of the root page.
        """
        _root, parent_page, _page = self.create_page_tree()

        page = PageFactory(title__title="Sitemap")
        placeholder = Placeholder.objects.create(slot="maincontent")
        page.placeholders.add(placeholder)

        context = self.get_practical_plugin_context({"current_page": page})
        parent_instance = add_plugin(placeholder, HTMLSitemapPlugin, "en")
        add_plugin(
            placeholder,
            plugin_type="HTMLSitemapPagePlugin",
            language="en",
            target=parent_instance,
            root_page=parent_page,
            include_root_page=False,
        )

        html = context["cms_content_renderer"].render_placeholder(
            placeholder, context=context, language="en"
        )
        self.assertHTMLEqual(
            html,
            """
            <div class="sitemap">
              <ul>
                <li><a href="/en/root/parent/page/">Page</a></li>
                <li><a href="/en/root/parent/sibling/">Sibling</a></li>
              </ul>
            </div>
            """,
        )

    def test_cms_plugins_htmlsitemap_no_root_page_max_depth(self):
        """
        A site map page not targeted to a root page can be limited in depth (number of nesting
        levels displayed).
        """
        self.create_page_tree()

        page = PageFactory(title__title="Sitemap")
        placeholder = Placeholder.objects.create(slot="maincontent")
        page.placeholders.add(placeholder)

        context = self.get_practical_plugin_context({"current_page": page})
        parent_instance = add_plugin(placeholder, HTMLSitemapPlugin, "en")
        add_plugin(
            placeholder,
            plugin_type="HTMLSitemapPagePlugin",
            language="en",
            target=parent_instance,
            max_depth=2,
        )

        html = context["cms_content_renderer"].render_placeholder(
            placeholder, context=context, language="en"
        )
        self.assertHTMLEqual(
            html,
            """
            <div class="sitemap">
              <ul>
                <li><a href="/en/root/">Root</a>
                  <ul>
                    <li><a href="/en/root/parent/">Parent</a></li>
                    <li><a href="/en/root/uncle/">Uncle</a></li>
                  </ul>
                </li>
                <li><a href="/en/sitemap/">Sitemap</a></li>
              </ul>
            </div>
            """,
        )

    def test_cms_plugins_htmlsitemap_root_page_include_max_depth(self):
        """
        A site map page targeted to a root page in "include" mode can be limited in depth (number
        of nesting levels displayed).
        """
        root_page, _parent, _page = self.create_page_tree()

        page = PageFactory(title__title="Sitemap")
        placeholder = Placeholder.objects.create(slot="maincontent")
        page.placeholders.add(placeholder)

        context = self.get_practical_plugin_context({"current_page": page})
        parent_instance = add_plugin(placeholder, HTMLSitemapPlugin, "en")
        add_plugin(
            placeholder,
            plugin_type="HTMLSitemapPagePlugin",
            language="en",
            target=parent_instance,
            root_page=root_page,
            max_depth=2,
        )

        html = context["cms_content_renderer"].render_placeholder(
            placeholder, context=context, language="en"
        )
        self.assertHTMLEqual(
            html,
            """
            <div class="sitemap">
              <ul>
                <li><a href="/en/root/">Root</a>
                  <ul>
                    <li><a href="/en/root/parent/">Parent</a></li>
                    <li><a href="/en/root/uncle/">Uncle</a></li>
                  </ul>
                </li>
              </ul>
            </div>
            """,
        )

    def test_cms_plugins_htmlsitemap_root_page_exclude_max_depth(self):
        """
        A site map page targeted to a root page in "exclude" mode can be limited in depth (number
        of nesting levels displayed).
        """
        root_page, _parent, _page = self.create_page_tree()

        page = PageFactory(title__title="Sitemap")
        placeholder = Placeholder.objects.create(slot="maincontent")
        page.placeholders.add(placeholder)

        context = self.get_practical_plugin_context({"current_page": page})
        parent_instance = add_plugin(placeholder, HTMLSitemapPlugin, "en")
        add_plugin(
            placeholder,
            plugin_type="HTMLSitemapPagePlugin",
            language="en",
            target=parent_instance,
            root_page=root_page,
            include_root_page=False,
            max_depth=1,
        )

        html = context["cms_content_renderer"].render_placeholder(
            placeholder, context=context, language="en"
        )
        self.assertHTMLEqual(
            html,
            """
            <div class="sitemap">
              <ul>
                <li><a href="/en/root/parent/">Parent</a></li>
                <li><a href="/en/root/uncle/">Uncle</a></li>
              </ul>
            </div>
            """,
        )

    def test_cms_plugins_htmlsitemap_in_navigation(self):
        """Pages excluded from navigation can be excluded from a sitemap page."""
        self.create_page_tree(parent_kwargs={"in_navigation": False})

        page = PageFactory(title__title="Sitemap")
        placeholder = Placeholder.objects.create(slot="maincontent")
        page.placeholders.add(placeholder)

        context = self.get_practical_plugin_context({"current_page": page})
        parent_instance = add_plugin(placeholder, HTMLSitemapPlugin, "en")
        add_plugin(
            placeholder,
            plugin_type="HTMLSitemapPagePlugin",
            language="en",
            target=parent_instance,
            in_navigation=True,
        )

        html = context["cms_content_renderer"].render_placeholder(
            placeholder, context=context, language="en"
        )
        self.assertHTMLEqual(
            html,
            """
            <div class="sitemap">
              <ul>
                <li><a href="/en/root/">Root</a>
                  <ul>
                    <li><a href="/en/root/uncle/">Uncle</a></li>
                  </ul>
                </li>
                <li><a href="/en/sitemap/">Sitemap</a></li>
              </ul>
            </div>
            """,
        )

    def test_cms_plugins_htmlsitemap_login_required(self):
        """
        Pages requiring login can be excluded from a sitemap page for an anonymous user.
        """
        self.create_page_tree(parent_kwargs={"login_required": True})

        page = PageFactory(title__title="Sitemap")
        placeholder = Placeholder.objects.create(slot="maincontent")
        page.placeholders.add(placeholder)

        context = self.get_practical_plugin_context({"current_page": page})
        parent_instance = add_plugin(placeholder, HTMLSitemapPlugin, "en")
        add_plugin(
            placeholder,
            plugin_type="HTMLSitemapPagePlugin",
            language="en",
            target=parent_instance,
        )

        html = context["cms_content_renderer"].render_placeholder(
            placeholder, context=context, language="en"
        )
        self.assertHTMLEqual(
            html,
            """
            <div class="sitemap">
              <ul>
                <li><a href="/en/root/">Root</a>
                  <ul>
                    <li><a href="/en/root/uncle/">Uncle</a></li>
                  </ul>
                </li>
                <li><a href="/en/sitemap/">Sitemap</a></li>
              </ul>
            </div>
            """,
        )

        # Check that a logged in user can see the page
        request = RequestFactory()
        request.current_page = page
        request.user = UserFactory()
        context["request"] = request
        html = context["cms_content_renderer"].render_placeholder(
            placeholder, context=context, language="en"
        )

        self.assertHTMLEqual(
            html,
            """
            <div class="sitemap">
              <ul>
                <li><a href="/en/root/">Root</a>
                  <ul>
                    <li><a href="/en/root/parent/">Parent</a>
                      <ul>
                        <li><a href="/en/root/parent/page/">Page</a></li>
                        <li><a href="/en/root/parent/sibling/">Sibling</a></li>
                      </ul>
                    </li>
                    <li><a href="/en/root/uncle/">Uncle</a></li>
                  </ul>
                </li>
                <li><a href="/en/sitemap/">Sitemap</a></li>
              </ul>
            </div>
            """,
        )

    def test_cms_plugins_htmlsitemap_public_page(self):
        """Unpublished or draft pages should be excluded from a public sitemap page."""
        root = PageFactory(
            title__title="Root", title__language="en", should_publish=True
        )
        parent = PageFactory(
            title__title="Parent",
            parent=root,
            title__language="en",
            should_publish=True,
        )
        PageFactory(
            title__title="Uncle", parent=root, title__language="en", should_publish=True
        )
        PageFactory(
            title__title="Page",
            parent=parent,
            title__language="en",
            should_publish=True,
        )
        PageFactory(
            title__title="Sibling",
            parent=parent,
            title__language="en",
            should_publish=True,
        )

        self.assertTrue(parent.unpublish("en"))
        root_title = root.title_set.first()
        root_title.title = "modified title"
        root_title.save()

        page = PageFactory(
            title__title="Sitemap", title__language="en", should_publish=True
        )
        self.assertTrue(page.is_published("en"))
        placeholder = Placeholder.objects.create(slot="maincontent")
        public_page = page.get_public_object()
        public_page.placeholders.add(placeholder)

        context = self.get_practical_plugin_context({"current_page": public_page})
        parent_instance = add_plugin(placeholder, HTMLSitemapPlugin, "en")
        add_plugin(
            placeholder,
            plugin_type="HTMLSitemapPagePlugin",
            language="en",
            target=parent_instance,
        )

        html = context["cms_content_renderer"].render_placeholder(
            placeholder, context=context, language="en"
        )
        self.assertHTMLEqual(
            html,
            """
            <div class="sitemap">
              <ul>
                <li><a href="/en/root/">Root</a>
                  <ul>
                    <li><a href="/en/root/uncle/">Uncle</a></li>
                  </ul>
                </li>
                <li><a href="/en/sitemap/">Sitemap</a></li>
              </ul>
            </div>
            """,
        )

        # Check that after publication, the modification is shown indeed
        root.publish("en")
        html = context["cms_content_renderer"].render_placeholder(
            placeholder, context=context, language="en"
        )
        self.assertHTMLEqual(
            html,
            """
            <div class="sitemap">
              <ul>
                <li><a href="/en/root/">modified title</a>
                  <ul>
                    <li><a href="/en/root/uncle/">Uncle</a></li>
                  </ul>
                </li>
                <li><a href="/en/sitemap/">Sitemap</a></li>
              </ul>
            </div>
            """,
        )

    def test_cms_plugins_htmlsitemap_no_exclusion(self):
        """
        Non regression test.
        A sitemap configuration that does not trigger any exclusion should not be empty.
        """
        self.create_page_tree(parent_kwargs={"login_required": True})

        page = PageFactory(title__title="Sitemap")
        placeholder = Placeholder.objects.create(slot="maincontent")
        page.placeholders.add(placeholder)

        context = self.get_practical_plugin_context({"current_page": page})
        request = RequestFactory()
        request.current_page = page
        request.user = UserFactory()
        context["request"] = request

        parent_instance = add_plugin(placeholder, HTMLSitemapPlugin, "en")
        add_plugin(
            placeholder,
            plugin_type="HTMLSitemapPagePlugin",
            language="en",
            target=parent_instance,
        )

        html = context["cms_content_renderer"].render_placeholder(
            placeholder, context=context, language="en"
        )
        self.assertHTMLEqual(
            html,
            """
            <div class="sitemap">
              <ul>
                <li><a href="/en/root/">Root</a>
                  <ul>
                    <li><a href="/en/root/parent/">Parent</a>
                      <ul>
                        <li><a href="/en/root/parent/page/">Page</a></li>
                        <li><a href="/en/root/parent/sibling/">Sibling</a></li>
                      </ul>
                    </li>
                    <li><a href="/en/root/uncle/">Uncle</a></li>
                  </ul>
                </li>
                <li><a href="/en/sitemap/">Sitemap</a></li>
              </ul>
            </div>
            """,
        )

    def test_cms_plugins_htmlsitemap_static_placeholder(self):
        """A sitemap page placed in a static placeholder should work."""
        self.create_page_tree()

        page = PageFactory(title__title="Sitemap")
        self.assertEqual(StaticPlaceholder.objects.count(), 1)
        placeholder = StaticPlaceholder.objects.get()

        context = self.get_practical_plugin_context({"current_page": page})
        parent_instance = add_plugin(placeholder.draft, HTMLSitemapPlugin, "en")
        add_plugin(
            placeholder.draft,
            plugin_type="HTMLSitemapPagePlugin",
            language="en",
            target=parent_instance,
        )

        html = context["cms_content_renderer"].render_placeholder(
            placeholder.draft, context=context, language="en"
        )
        self.assertHTMLEqual(
            html,
            """
            <div class="sitemap">
              <ul>
                <li><a href="/en/root/">Root</a>
                  <ul>
                    <li><a href="/en/root/parent/">Parent</a>
                      <ul>
                        <li><a href="/en/root/parent/page/">Page</a></li>
                        <li><a href="/en/root/parent/sibling/">Sibling</a></li>
                      </ul>
                    </li>
                    <li><a href="/en/root/uncle/">Uncle</a></li>
                  </ul>
                </li>
                <li><a href="/en/sitemap/">Sitemap</a></li>
              </ul>
            </div>
            """,
        )

    def test_cms_plugins_htmlsitemap_no_current_page(self):
        """
        A sitemap plugin inserted on a page with no current_page in its context
        should display all published pages from its root
        """
        self.create_page_tree()

        root = PageFactory(
            title__title="Root", title__language="en", should_publish=True
        )
        PageFactory(
            title__title="Parent",
            parent=root,
            title__language="en",
            should_publish=True,
        )
        PageFactory(
            title__title="Uncle", parent=root, title__language="en", should_publish=True
        )
        self.assertEqual(StaticPlaceholder.objects.count(), 1)
        placeholder = StaticPlaceholder.objects.get()

        context = self.get_practical_plugin_context()
        parent_instance = add_plugin(placeholder.draft, HTMLSitemapPlugin, "en")
        add_plugin(
            placeholder.draft,
            plugin_type="HTMLSitemapPagePlugin",
            language="en",
            target=parent_instance,
        )

        html = context["cms_content_renderer"].render_placeholder(
            placeholder.draft, context=context, language="en"
        )
        self.assertHTMLEqual(
            html,
            """
            <div class="sitemap">
              <ul>
                <li><a href="/en/root/">Root</a>
                  <ul>
                    <li><a href="/en/root/parent/">Parent</a></li>
                    <li><a href="/en/root/uncle/">Uncle</a></li>
                  </ul>
                </li>
              </ul>
            </div>
            """,
        )
