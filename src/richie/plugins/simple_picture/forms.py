"""SimplePicture plugin forms."""

from django import forms

from djangocms_picture.models import Picture


class SimplePictureForm(forms.ModelForm):
    """Plugin form used to add a picture from the frontend admin."""

    class Meta:
        """Form meta attributes"""

        model = Picture
        fields = ["picture"]
