"""Richie template tags to manipulate categories."""

from django import template
from django.utils import translation

from classytags.arguments import Argument
from classytags.core import Options
from classytags.helpers import AsTag
from cms.models import Page

from ..models import Category

register = template.Library()


@register.tag("get_related_category_pages")
class GetRelatedCategories(AsTag):
    """
    A template tag to retrieve as a context variable, all the categories related via a
    CategoryPlugin to one or more of the pages targeted by a queryset or iterable.

    eg:
    {% get_related_category_pages pages as categories %}

    Keyword arguments:
        pages: a queryset of iterable targeting a group of cms pages.
    """

    options = Options(
        Argument("pages", required=True),
        "as",
        Argument("varname", required=True, resolve=False),
    )

    def get_value(self, context, **kwargs):
        """
        Get all categories related to either of the pages targeted by the queryset or
        iterator passed in argument.
        """
        current_page = context["current_page"]
        language = translation.get_language()

        selector = "category_plugins__cmsplugin_ptr__"
        filter_dict = {
            f"{selector:s}language": language,
            f"{selector:s}placeholder__page__publisher_is_draft": current_page.publisher_is_draft,
            f"{selector:s}placeholder__page__in": kwargs["pages"],
        }

        if context["current_page"].publisher_is_draft:
            query = Category.objects.filter(
                extended_object__publisher_is_draft=True,
                extended_object__in=Page.objects.filter(**filter_dict),
            )
        else:
            query = Category.objects.filter(
                extended_object__publisher_is_draft=False,
                extended_object__publisher_public__in=Page.objects.filter(
                    **filter_dict
                ),
            )

        return (
            query.select_related("extended_object")
            .order_by("extended_object__node__path")
            .distinct()
        )
