"""Templatetags module for the first_n filter."""
from django import template

# pylint: disable=invalid-name
register = template.Library()


@register.filter("first_n")
def first_n_filter(value, arg):
    """
    Picks the first N items in a list.
    The reason this exists over stock "slice" is to allow using a variable to define
    the number of items to pick.
    """
    return value[slice(0, arg)]
