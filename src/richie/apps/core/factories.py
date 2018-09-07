"""
Core factories
"""

from django.conf import settings
from django.contrib.auth.hashers import make_password

import factory
from filer.models.imagemodels import Image

from ..core.helpers import create_i18n_page


class UserFactory(factory.django.DjangoModelFactory):
    """
    Create a fake user with Faker.
    """

    class Meta:
        model = settings.AUTH_USER_MODEL

    username = factory.Faker("user_name")
    email = factory.Faker("email")
    password = make_password("password")


class FilerImageFactory(factory.django.DjangoModelFactory):
    """
    Create a Filer Image for filer.fields.image.FilerImageField.
    """

    class Meta:
        model = Image

    owner = factory.SubFactory(UserFactory)
    file = factory.django.ImageField()
    original_filename = factory.Faker("file_name", category="image")


class PageExtensionDjangoModelFactory(factory.django.DjangoModelFactory):
    """
    Factories for page extensions have in common that:
    - they must create a related page with a title,
    - the related page may have to be placed below a "parent" page,
    - we may want to test the related page in several languages.

    All this is mutualized by inheriting from the present class.
    """

    languages = [settings.LANGUAGE_CODE]
    parent = None
    template = None
    title = None
    in_navigation = False

    @factory.lazy_attribute
    def extended_object(self):
        """
        Automatically create a related page with the title (or random title if None) in all the
        requested languages
        """
        return create_i18n_page(
            title=self.title,
            languages=self.languages,
            template=self.template,
            in_navigation=self.in_navigation,
            parent=self.parent,
        )

    @classmethod
    def _after_postgeneration(cls, instance, create, results=None):
        """
        This hook method is called last when generating an instance from a factory. The super
        method saves the instance one last time after all the "post_generation" hooks have played.
        this is the moment to finally publish the pages. If we published the pages before this
        final "save", they would be set back to a pending state and would not be in a clean
        published state.
        """
        super()._after_postgeneration(instance, create, results=results)
        if results.get("should_publish", False):
            for language in instance.extended_object.get_languages():
                instance.extended_object.publish(language)
        instance.refresh_from_db()

    @factory.post_generation
    # pylint: disable=no-self-use,unused-argument
    def should_publish(self, create, extracted, **kwargs):
        """
        Mark the pages for publishing. The actual publishing is done by the
        "_after_post_generation" hook method above.
        """
        if create and extracted:
            return True
        return False
