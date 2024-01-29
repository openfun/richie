"""
Useful stuff for testing
"""

from cms.test_utils.testcases import CMSTestCase


class CMSPluginTestCase(CMSTestCase):
    """
    Enriched CMS test case object to include useful stuff about plugin
    rendering.

    Note:
        The CMSTestCase mixin from DjangoCMS is making queries in its "tearDown"
        method which causes database transaction errors with tests that have
        already generated a database error.

        A workaround is to decorate such tests with
        ``django.db.transaction`` (or to use it as a context manager) so that
        the test has its own transaction that is rolled back before the TearDown
        method sends its queries to the database.
    """

    def get_practical_plugin_context(self, extra_context=None):
        """
        Build a template context with dummy request object and
        instanciated content renderer suitable to perform full rendering of
        any plugin.

        Note:
            CMSTestCase use a dummy AnonymousUser on default behavior, you can
            override it with a custom user as an ``user`` attribute on your
            test case object. In most cases we should in fact define this
            attribute during test to use a UserFactory instead of a global
            user for every tests.

        Keyword Arguments:
            extra_context (dict): Dictionnary to add extra variable to context.
                Default to an empty dict.

        Returns:
            django.template.Context: Template context filled with request
            object as ``request`` item and content renderer as
            ``cms_content_renderer`` item.
        """
        context = self.get_context()
        if extra_context:
            context.update(extra_context)

        renderer = self.get_content_renderer(request=context["request"])

        # 'cms_content_renderer' is the attempted item name from CMS rendering
        # machinery
        context["cms_content_renderer"] = renderer

        return context
