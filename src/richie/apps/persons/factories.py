"""
Persons factories
"""
from django.core.files import File
from django.utils.translation import get_language

import factory
from cms.api import add_plugin
from filer.models.imagemodels import Image

from .models import Person, PersonTitle, PersonTitleTranslation
from ..core.factories import PageExtensionDjangoModelFactory
from ..core.helpers import create_text_plugin
from ..core.utils import file_getter


class PersonTitleFactory(factory.django.DjangoModelFactory):
    """
    Factory to generate random yet realistic PersonTitle objects with one default translation.
    """

    translation = factory.RelatedFactory(
        "richie.apps.persons.factories.PersonTitleTranslationFactory", "master"
    )

    class Meta:
        model = PersonTitle


class PersonTitleTranslationFactory(factory.django.DjangoModelFactory):
    """
    Factory to generate random yet realistic translation instances for the PersonTitle model.
    """

    class Meta:
        model = PersonTitleTranslation

    master = None
    language_code = factory.LazyAttribute(lambda o: get_language())
    title = factory.Faker("prefix")
    abbreviation = factory.LazyAttribute(lambda o: o.title[0])


class PersonFactory(PageExtensionDjangoModelFactory):
    """
    Person factory to generate random yet realistic person's name and title
    """

    class Meta:
        model = Person
        exclude = [
            "page_in_navigation",
            "page_languages",
            "page_parent",
            "page_template",
            "page_title",
        ]

    # fields concerning the related page
    page_template = Person.TEMPLATE_DETAIL

    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    person_title = factory.SubFactory(PersonTitleFactory)

    @factory.lazy_attribute
    def page_title(self):
        """
        Build the page title from the person's title and names
        """
        names = [
            self.person_title.title if self.person_title else None,
            self.first_name,
            self.last_name,
        ]
        # Join the names that are null into a string
        return " ".join([n for n in names if n is not None])

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_portrait(self, create, extracted, **kwargs):
        """
        Add a portrait with a random image
        """
        if create and extracted:
            portrait_placeholder = self.extended_object.placeholders.get(
                slot="portrait"
            )

            portrait_file = file_getter("portrait")()
            wrapped_portrait = File(portrait_file, portrait_file.name)
            portrait = Image.objects.create(file=wrapped_portrait)
            for language in self.extended_object.get_languages():
                add_plugin(
                    language=language,
                    placeholder=portrait_placeholder,
                    plugin_type="PicturePlugin",
                    picture=portrait,
                    attributes={"alt": "portrait image"},
                )

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_resume(self, create, extracted, **kwargs):
        """
        Add a text plugin for resume with a long random text
        """
        if create and extracted:
            create_text_plugin(
                self.extended_object,
                "resume",
                nb_paragraphs=1,
                languages=self.extended_object.get_languages(),
            )
