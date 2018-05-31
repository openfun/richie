"""
Helpers that can be useful throughout the whole project
"""
from django.utils.text import slugify

from cms.api import create_page, create_title


def create_i18n_page(content, is_homepage=False, **kwargs):
    """
    Creating a multilingual page is not straightforward so we should have a helper

    This content argument should be a dictionary with the title of the page in each language:

        {
            'en': 'About',
            'fr': 'A propos',
            'de': 'Impressum',
        }

    """
    template = kwargs.pop("template", None) or "richie/fullwidth.html"

    # Create the page with a first language from what is given to us
    languages = list(content.keys())  # convert `dict_keys` to list so it can be poped
    first_language = languages.pop(0)
    slug = slugify(content[first_language])
    page = create_page(
        language=first_language,
        menu_title=content[first_language],
        title=content[first_language],
        slug=slug,
        template=template,
        **kwargs
    )

    if is_homepage is True:
        page.set_as_homepage()

    # Add a title for each additional language
    for language in languages:
        create_title(
            language=language,
            menu_title=content[language],
            title=content[language],
            slug=slugify(content[language]),
            page=page,
        )
        # Publish page in each additional language
        if kwargs.get("published") is True:
            page.publish(language)

    return page
