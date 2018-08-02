"""
Persons factories
"""
import os
import random

from django.conf import settings
from django.core.files import File

import factory
from cms.api import add_plugin
from filer.models.imagemodels import Image

from ..core.factories import PageExtensionDjangoModelFactory
from ..core.tests.utils import file_getter
from .models import Person, PersonTitle


class PersonTitleFactory(factory.django.DjangoModelFactory):
    """
    PersonTitle factory to generate random yet realistic person's title
    """

    class Meta:
        model = PersonTitle

    title = factory.Faker("prefix")
    abbreviation = factory.LazyAttribute(lambda o: o.title)


class PersonFactory(PageExtensionDjangoModelFactory):
    """
    Person factory to generate random yet realistic person's name and title
    """

    class Meta:
        model = Person
        exclude = ["languages", "parent", "template", "title"]

    template = Person.TEMPLATE_DETAIL

    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    person_title = factory.SubFactory(PersonTitleFactory)

    @factory.lazy_attribute
    def title(self):
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
    def with_content(self, create, extracted, **kwargs):
        """
        Add content plugins displayed in the "portrait" and "resume" placeholder
        of the person page:

        - Picture plugin featuring a random portrait image,
        - Text plugin featuring the person resume with a random long text.
        """
        if create and extracted:
            language = settings.LANGUAGE_CODE
            portrait_placeholder = self.extended_object.placeholders.get(
                slot="portrait"
            )

            resume_placeholder = self.extended_object.placeholders.get(slot="resume")

            # Add a portrait with a random image
            portrait_file = file_getter(os.path.dirname(__file__), "portrait")()
            wrapped_portrait = File(portrait_file, portrait_file.name)
            portrait = Image.objects.create(file=wrapped_portrait)
            add_plugin(
                language=language,
                placeholder=portrait_placeholder,
                plugin_type="PicturePlugin",
                picture=portrait,
                attributes={"alt": "portrait image"},
            )

            # Add a text plugin for resume with a long random text
            nb_paragraphs = random.randint(2, 4)
            paragraphs = [
                factory.Faker("text", max_nb_chars=random.randint(200, 1000)).generate(
                    {}
                )
                for i in range(nb_paragraphs)
            ]
            body = ["<p>{:s}</p>".format(p) for p in paragraphs]
            add_plugin(
                language=language,
                placeholder=resume_placeholder,
                plugin_type="CKEditorPlugin",
                body="".join(body),
            )
