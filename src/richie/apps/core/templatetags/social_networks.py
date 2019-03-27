"""
Include badges one by one: ::

    {% badges "fb-share" "twitter-intent" "mailto" %}

Use shortcut badge pack: ::

    {% badges_pack "course" %}
    {% badges_pack "blogpost" %}

* Badge config comes from settings.SOCIAL_NETWORKS_BADGES;
* Badge pack config comes from settings.SOCIAL_NETWORKS_PACKS;
* Each badge config has a context to give within String.format() for each text (subject, url, body);
* Config context is augmented with page_url and page_title;
* Each text should be urlencoded ? (twitter seems to require it but not other sharing methods?);
* Use "apps.search.utils.i18n.get_best_field_language" to find accurate text from current language;

"""
from django.conf import settings
from django import template
from django.template.defaultfilters import stringfilter
from django.template.loader import render_to_string
from django.utils.html import format_html
from django.utils.http import urlencode

from richie.apps.search.utils.i18n import get_best_field_language


register = template.Library()


class BadgeRenderer(object):
    """
    Badge HTML renderer

    Arguments:
        lang (str): Language code to use for text translation selection.

    Keyword Arguments:
        page (cms.models.pagemodel.Page): Optional page object to get title
            and url that will be added to template context.
    """
    FORMATTABLE_ITEMS = ['url', 'content']

    def __init__(self, lang, page=None):
        self.page = page
        self.lang = lang

    def get_context(self, config_name, initial_context):
        """
        Transform context so if an item is a dict it it passed to
        "get_best_field_language"
        """
        context = {
            "badge_name": config_name,
        }

        if self.page:
            context.update({
                "page_title": self.page.get_title(language=self.lang),
                "page_url": self.page.get_absolute_url(language=self.lang),
            })

        # Get context items with possible translations
        for k,v in initial_context.items():
            # Everything but dictionnary is just copied
            if not isinstance(v, dict):
                context[k] = template.Template(v).render(template.Context(context))
            # Dictionnary is assumed to be a dict of translations, only the
            # translation with the best available language is keeped
            else:
                value = get_best_field_language(v, self.lang)
                if value is None:
                    msg = ("Social network badge '{config}' item '{item}' "
                           "have no translation for available language from "
                           "'settings.LANGUAGES'")
                    raise KeyError(msg.format(config=config_name, item=k))

                context[k] = template.Template(value).render(template.Context(context))

        # Second pass to augment formattable items with context
        for item in self.FORMATTABLE_ITEMS:
            if item in context:
                context[item] = template.Template(context[item]).render(template.Context(context))

        return context

    def render(self, config):
        """
        Render HTML from template and config
        """
        config_name = config["name"]
        template = config["template"]
        context = self.get_context(config_name, config["context"])

        return render_to_string(template, context)


@register.simple_tag(takes_context=True)
def badges(context, *args, **kwargs):
    """
    Template tag to build badge HTML for each given badge name.

    Badge name have to be a valid item ``name`` in
    ``settings.SOCIAL_NETWORKS_BADGES``, this item will be use for badge
    configuration.

    A badge configuration contains a ``template`` path item to render with
    ``context`` item. Badge context can contains translatable texts for
    available languages from ``settings.LANGUAGES``

    Example:
        {% badges "fb-share" %}
        OR
        {% badges "fb-share" "twitter-intent" "mailto" %}
    """
    badges = []
    page = context.get("current_page", None)
    lang = context.get("lang", None) or settings.LANGUAGE_CODE

    renderer = BadgeRenderer(lang, page=page)

    for name in args:
        try:
            config = [item for item in settings.SOCIAL_NETWORKS_BADGES if item.get("name")==name][0]
        except IndexError:
            raise IndexError(f"settings.SOCIAL_NETWORKS_BADGES has no item with name: {name}")

        badges.append(renderer.render(config))

    # TODO: return safe HTML
    return "".join(badges)
