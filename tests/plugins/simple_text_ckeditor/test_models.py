"""
Model tests
"""

from django.test import TestCase

from richie.plugins.simple_text_ckeditor.models import SimpleText


class SimpleTextModelsTestCase(TestCase):
    """Model tests case"""

    def test_models_simpletext_html5_cleaner_unclosed_tag(self):
        """
        HTML5lib Cleaner fix unclosed element.
        """

        content = (
            """<p><a href="http://perdu.com/" class="foo">Lorem """
            """ipsum</a> dolor"""
        )
        attempted = (
            """<p><a href="http://perdu.com/" class="foo">Lorem """
            """ipsum</a> dolor</p>"""
        )

        instance = SimpleText(body=content)

        instance.save()

        self.assertEqual(instance.body, attempted)

    def test_models_simpletext_html5_sanitize_tag(self):
        """
        HTML5lib Cleaner escape potential malicious tag like iframe.

        Behavior can be modified with settings:

        https://github.com/divio/djangocms-text-ckeditor#configurable-sanitizer
        """

        content = """<iframe src="http://perdu.com/" border=0></iframe>"""
        attempted = (
            """&lt;iframe src="http://perdu.com/" """
            """border="0"&gt;&lt;/iframe&gt;"""
        )

        instance = SimpleText(body=content)

        instance.save()

        self.assertEqual(instance.body, attempted)

    def test_models_simpletext_html5_sanitize_attribute(self):
        """
        HTML5lib Cleaner remove uncommon tag attribute.

        Behavior can be modified with settings:

        https://github.com/divio/djangocms-text-ckeditor#configurable-sanitizer
        """

        content = """<div class="foo" my-own-attr="bar">Yipee</div>"""
        attempted = """<div class="foo">Yipee</div>"""

        instance = SimpleText(body=content)

        instance.save()

        self.assertEqual(instance.body, attempted)
