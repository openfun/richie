"""
Helpers that can be useful throughout the whole project
"""
import random

from django.conf import settings
from django.utils.text import slugify

import factory
from cms.api import add_plugin, create_page, create_title


def create_i18n_page(title=None, languages=None, is_homepage=False, **kwargs):
    """
    Creating a multilingual page is not straightforward so we should have a helper

    This content argument should be a dictionary with the title of the page in each language:

        {
            'en': 'About',
            'fr': 'A propos',
            'de': 'Impressum',
        }

    """
    template = kwargs.pop("template", None) or "richie/single_column.html"

    if title is None:
        # Create realistic titles in each language with faker
        languages = languages or [settings.LANGUAGE_CODE]
        i18n_titles = {
            language: factory.Faker("catch_phrase", locale=language).generate({})
            for language in languages
        }

    elif isinstance(title, dict):
        # Check that the languages passed are coherent with the languages requested if any
        if languages:
            assert set(languages).issubset(title.keys())
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
    assert set(languages).issubset({l[0] for l in settings.LANGUAGES})
    # Make a copy of languages to avoid muting it in what follows
    languages = list(languages)
    # Create the page with a first language from what is given to us
    first_language = languages.pop(0)

    slug = slugify(i18n_titles[first_language])
    page = create_page(
        language=first_language,
        title=i18n_titles[first_language],
        slug=slug,
        template=template,
        **kwargs,
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


# pylint: disable=too-many-arguments
def create_text_plugin(
    page,
    slot,
    languages=None,
    is_html=True,
    max_nb_chars=None,
    nb_paragraphs=None,
    plugin_type="CKEditorPlugin",
):
    """
    A common function to create and add a text plugin of any type instance to
    a placeholder filled with some random text using Faker.

    Arguments:
        page (cms.models.pagemodel.Page): Instance of a Page used to search for
            given slot (aka a placeholder name).
        slot (string): A placeholder name available from page template.

    Keyword Arguments:
        languages (iterable): An iterable yielding language codes for which a text plugin should
            be created. If ``None`` (default) it uses the default language from settings.
        is_html (boolean): If True, every paragraph will be surrounded with an
            HTML paragraph markup. Default is True.
        max_nb_chars (integer): Number of characters limit to create each
            paragraph. Default is None so a random number between 200 and 400
            will be used at each paragraph.
        nb_paragraphs (integer): Number of paragraphs to create in content.
            Default is None so a random number between 2 and 4 will be used.
        plugin_type (string or object): Type of plugin. Default use CKEditorPlugin
            but you can use any other similar plugin that has a body attribute.

    Returns:
        object: Created plugin instance.
    """
    languages = languages or [settings.LANGUAGE_CODE]
    container = "<p>{:s}</p>" if is_html else "{:s}"
    nb_paragraphs = nb_paragraphs or random.randint(2, 4)

    placeholder = page.placeholders.get(slot=slot)

    for language in languages:
        paragraphs = []
        for _ in range(nb_paragraphs):
            max_nb_chars = max_nb_chars or random.randint(200, 400)
            paragraphs.append(
                factory.Faker(
                    "text", max_nb_chars=max_nb_chars, locale=language
                ).generate({})
            )
        body = [container.format(p) for p in paragraphs]

        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type=plugin_type,
            body="".join(body),
        )
