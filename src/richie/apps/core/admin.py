"""Utility functions for admin classes."""

from django.urls import reverse
from django.utils.html import format_html


def link_field(field_name, view_name=None, anchor=None, target_blank=True):
    """Convert the representation of an object linked by a foreign key into a clickable link.

    Parameters
    ----------
    field_name (string):
        If `field_name` is "name", link text will be str(obj.name) and link will be the admin
        url for obj.name.id:change.
    view_name (string):
        Optional alternative view name to compute the url of the linked object in place of the
        standard object admin change form.
    anchor (string):
        Optional alternative anchor to display on the link in place of the str representation
        of the linked object.

    Returns
    -------
    function
        The function that Django admin must call with the object as argument to render the field
        as a link.

    """

    def _link_field(obj):
        """Render a link in Django admin for foreign key fields.

        The link replaces the string representation of the linked object that is rendered
        by Django by default for foreign keys.

        Parameters
        ----------
        obj: Type[models.Model]
            The instance of Django model for which we want to render the field `field_name`.

        Returns
        -------
        string
            The html representing the link to the object admin change view.

        """
        linked_obj = getattr(obj, field_name)
        if linked_obj is None:
            return "-"

        local_view_name = view_name
        if not local_view_name:
            app_label = linked_obj._meta.app_label
            model_name = linked_obj._meta.model_name
            local_view_name = f"admin:{app_label}_{model_name}_change"

        local_anchor = anchor or str(linked_obj)
        link_url = reverse(local_view_name, args=[linked_obj.id])
        markup = (
            '<a target="_blank" rel="noopener noreferrer" href="{:s}">{!s}</a>'
            if target_blank
            else '<a href="{:s}">{!s}</a>'
        )
        return format_html(markup, link_url, local_anchor)

    _link_field.short_description = field_name
    return _link_field
