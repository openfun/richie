"""
Persons factories
"""
import factory
from cms.api import create_page

from .models import Person, PersonTitle


class PersonTitleFactory(factory.django.DjangoModelFactory):
    """
    PersonTitle factory to generate random yet realistic person's title
    """

    class Meta:
        model = PersonTitle

    title = factory.Faker("prefix")
    abbreviation = factory.LazyAttribute(lambda o: o.title)


class PersonFactory(factory.django.DjangoModelFactory):
    """
    Person factory to generate random yet realistic person's name and title
    """

    class Meta:
        model = Person

    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    person_title = factory.SubFactory(PersonTitleFactory)

    @factory.lazy_attribute
    def extended_object(self):
        """
        Automatically create a related page with the person's name as title
        """
        return create_page(
            "Page of {title} {first_name} {last_name}".format(
                title=self.person_title.title,
                first_name=self.first_name,
                last_name=self.last_name,
            ),
            Person.TEMPLATE_DETAIL,
            "en",
        )
