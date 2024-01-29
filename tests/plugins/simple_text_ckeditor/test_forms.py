"""
Forms tests
"""

from django.test import TestCase

from richie.plugins.simple_text_ckeditor.forms import CKEditorPluginForm


class CKEditorPluginFormsTestCase(TestCase):
    """Tests for the SimpleText forms"""

    def test_forms_simpletext_clean_body(self):
        """
        Upon submission, the form should be cleaned:
        - normalization,
        - unescaping,
        - strip useless spaces.
        """
        data = {
            "body": "<div> <h1>株ＫＡ&nbsp;&ecirc;  </h1>   <b>&eacute;</b></div>",
        }
        form = CKEditorPluginForm(data)
        self.assertTrue(form.is_valid())
        self.assertEqual(
            form.cleaned_data["body"], "<div><h1>株KA\xa0ê  </h1><b>é</b></div>"
        )
