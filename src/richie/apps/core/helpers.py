"""
Helpers that can be useful throughout the whole project
"""
from functools import reduce
from operator import or_

from django.conf import settings
from django.contrib.auth.models import Permission
from django.core.exceptions import ImproperlyConfigured
from django.db.models import Q
from django.utils.text import slugify

from cms.api import create_page, create_title
from cms.models import Page


def get_permissions(names):
    """
    Given an iterable of permission names of the form "app_label.codename",
    return an iterable of the corresponding existing Permission objects.
    """
    names = set(names)  # Eliminate redundancies
    split_names = (name.split(".", 1) for name in names)
    query_elements = [
        Q(content_type__app_label=app_label, codename=codename)
        for app_label, codename in split_names
    ]
    permissions = (
        Permission.objects.filter(reduce(or_, query_elements))
        if query_elements
        else Permission.objects.none()
    )

    if len(permissions) != len(names):
        differences = names - {
            f"{p.content_type.app_label:s}.{p.codename:s}" for p in permissions
        }
        raise Permission.DoesNotExist(
            "Some permission names were not found: {:s}".format(", ".join(differences))
        )

    return permissions


def create_i18n_page(title, languages=None, is_homepage=False, **kwargs):
    """
    Creating a multilingual page is not straightforward so we should have a helper

    This content argument should be a dictionary with the title of the page in each language:

        {
            'en': 'About',
            'fr': 'A propos',
            'de': 'Impressum',
        }

    """
    kwargs["template"] = kwargs.get("template", "richie/single_column.html")

    if isinstance(title, dict):
        # Check that the languages passed are coherent with the languages requested if any
        if languages:
            invalid_languages = set(languages) - set(title.keys())
            if invalid_languages:
                raise ValueError(
                    "Page titles are missing in some requested languages: {:s}".format(
                        ",".join(invalid_languages)
                    )
                )
        else:
            languages = title.keys()
        i18n_titles = title

    elif isinstance(title, str):
        # Add a marker at the end of the string to differentiate each language
        languages = languages or [settings.LANGUAGE_CODE]
        i18n_titles = {language: title for language in languages}

    else:
        raise ValueError(
            "Title should be a string or a dictionary of language/string pairs"
        )

    # Assert that the languages passed are declared in settings
    invalid_languages = set(languages) - {
        language[0] for language in settings.LANGUAGES
    }
    if invalid_languages:
        raise ValueError(
            "You can't create pages in languages that are not declared: {:s}".format(
                ",".join(invalid_languages)
            )
        )

    # Make a copy of languages to avoid muting it in what follows
    languages = list(languages)
    # Create the page with a first language from what is given to us
    first_language = languages.pop(0)

    slug = slugify(i18n_titles[first_language])
    page = create_page(
        language=first_language, title=i18n_titles[first_language], slug=slug, **kwargs
    )

    if is_homepage is True:
        page.set_as_homepage()

    # Add a title for each additional language
    for language in languages:
        create_title(
            language=language,
            title=i18n_titles[language],
            slug=slugify(i18n_titles[language]),
            page=page,
        )
        # Publish page in each additional language
        if kwargs.get("published") is True:
            page.publish(language)

    return page


def recursive_page_creation(site, pages_info, parent=None):
    """
    Recursively create page following tree structure with parent/children.

    Arguments:
        site (django.contrib.sites.models.Site): Site object which page will
            be linked to.
        pages_info (dict): Page items to create recursively such as 'children' key
            value can be a dict to create child pages. The current page is
            given to children for parent relation.

    Keyword Arguments:
        parent (cms.models.pagemodel.Page): Page used as a parent to create
            page item from `pages` argument.

    Returns:
        dict: mapping of the page names passed in argument and the created page instances.
    """
    pages = {}

    for name, kwargs in pages_info.items():
        children = kwargs.pop("children", None)

        if kwargs.get("is_homepage"):
            query_params = {"is_home": True}
        else:
            query_params = {"reverse_id": name}

        try:
            page = Page.objects.get(
                publisher_is_draft=True, node__site=site, **query_params
            )
        except Page.DoesNotExist:
            page = create_i18n_page(
                site=site, parent=parent, published=True, reverse_id=name, **kwargs
            )

        pages[name] = page

        # Create children
        if children:
            children_pages = recursive_page_creation(site, children, parent=page)
            for child_name in children_pages:
                if child_name in pages:
                    raise ImproperlyConfigured(
                        "Page names should be unique: {:s}".format(child_name)
                    )
            pages.update(children_pages)

    return pages
