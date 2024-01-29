"""
Core factories
"""

import io
import os
import random

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.core.files import File
from django.utils.text import slugify

import factory
from cms import models as cms_models
from cms.api import add_plugin
from cms.utils import get_current_site
from filer.models.imagemodels import Image
from PIL import Image as PILimage

from ..core.helpers import create_i18n_page, get_permissions


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
    nb_paragraphs = nb_paragraphs or random.randint(2, 4)  # nosec

    placeholder = page.placeholders.get(slot=slot)

    for language in languages:
        paragraphs = []
        for _ in range(nb_paragraphs):
            max_nb_chars = max_nb_chars or random.randint(200, 400)  # nosec
            paragraphs.append(
                factory.Faker("text", max_nb_chars=max_nb_chars).evaluate(
                    None, None, {"locale": language}
                )
            )
        body = [container.format(p) for p in paragraphs]

        add_plugin(
            language=language,
            placeholder=placeholder,
            plugin_type=plugin_type,
            body="".join(body),
        )


class UserFactory(factory.django.DjangoModelFactory):
    """
    Create a fake user with Faker.
    """

    class Meta:
        model = settings.AUTH_USER_MODEL

    username = factory.Faker("user_name")
    email = factory.Faker("email")
    password = make_password("password")

    @factory.post_generation
    # pylint: disable=unused-argument
    def permissions(self, create, extracted, **kwargs):
        """Add permissions to the user from a list of permission full names."""
        if create and extracted:
            django_permissions = get_permissions(extracted)
            self.user_permissions.set(django_permissions)


class PermissionFactory(factory.django.DjangoModelFactory):
    """
    Create random permissions for a user or group.
    """

    class Meta:
        model = Permission

    codename = factory.Sequence(lambda n: f"permission_{n:d}")
    content_type = factory.Iterator(ContentType.objects.all())
    name = factory.Sequence(lambda n: f"permission #{n:d}")


class TitleFactory(factory.django.DjangoModelFactory):
    """Create random title objects for CMS pages."""

    language = factory.Iterator([lang[0] for lang in settings.LANGUAGES])
    page = None
    path = factory.LazyAttribute(lambda o: o.page.get_path_for_slug(o.slug, o.language))
    slug = factory.LazyAttribute(lambda o: slugify(o.title))
    title = factory.Faker("catch_phrase")

    class Meta:
        model = cms_models.Title

    @classmethod
    def _after_postgeneration(cls, instance, create, results=None):
        """Update the related page's languages (taken from DjangoCMS's create_page helper)."""
        super()._after_postgeneration(instance, create, results=results)
        page = instance.page
        if page:
            page_languages = page.get_languages()
            if instance.language not in page_languages:
                page.update_languages(page_languages + [instance.language])


class PageFactory(factory.django.DjangoModelFactory):
    """Create random CMS pages."""

    changed_by = factory.LazyAttribute(lambda o: slugify(o.user.username))
    created_by = factory.LazyAttribute(lambda o: slugify(o.user.username))
    title = factory.RelatedFactory(TitleFactory, "page")

    # Utility fields
    in_navigation = True
    login_required = False
    parent = None
    user = factory.SubFactory(UserFactory)

    class Meta:
        model = cms_models.Page
        exclude = ["parent", "user"]

    @factory.lazy_attribute
    def node(self):
        """Create a node for the page (under its parent if applicable)."""
        site = get_current_site()
        new_node = cms_models.TreeNode(site=site)

        if self.parent:
            return self.parent.node.add_child(instance=new_node)
        return cms_models.TreeNode.add_root(instance=new_node)

    @classmethod
    def _after_postgeneration(cls, instance, create, results=None):
        """
        This hook method is called last when generating an instance from a factory. The super
        method saves the instance one last time after all the "post_generation" hooks have played.

        This is the moment to finally publish the pages. If we published the pages before this
        final "save", they would be set back to a pending state and would not be in a clean
        published state.
        """
        super()._after_postgeneration(instance, create, results=results)
        instance.rescan_placeholders()

        if results.get("should_publish", False):
            for language in instance.get_languages():
                instance.publish(language)
            instance.get_public_object().rescan_placeholders()

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


class FilerImageFactory(factory.django.DjangoModelFactory):
    """
    Create a Filer Image for filer.fields.image.FilerImageField.
    """

    class Meta:
        model = Image

    original_filename = factory.Faker("file_name", category="image")
    default_alt_text = factory.Faker("sentence", nb_words=3)
    default_caption = factory.Faker("sentence", nb_words=3)

    # pylint: disable=no-self-use
    @factory.lazy_attribute
    def subject_location(self):
        """
        Generate random coordinates within the image.
        We assume its dimensions are 100x100 as is the case for below's random file.
        """
        return (random.randint(1, 100), random.randint(1, 100))  # nosec

    # pylint: disable=no-self-use
    @factory.lazy_attribute
    def file(self):
        """
        Fill file field with generated image on the fly by PIL.

        Generated image is just a dummy blank image of 100x100 with plain blue
        color.

        Returns:
            django.core.files.File: File object.
        """
        thumb = PILimage.new("RGB", (100, 100), "blue")
        thumb_io = io.BytesIO()
        thumb.save(thumb_io, format="JPEG")

        return File(thumb_io, name=self.original_filename)


def image_getter(path):
    """
    Create and return an instance of Image linked to the file passed in argument.
    """
    # Factory boy's "from_func" param is expecting a file but does not seem to close it
    # properly. Let's load the content of the file in memory and pass it as a BytesIO to
    # factory boy so that the file is nicely closed
    with open(path, "rb") as image_file:
        in_memory_file = io.BytesIO(image_file.read())

    filename = os.path.basename(path)
    wrapped_file = File(in_memory_file, filename)
    return Image.objects.create(file=wrapped_file)


class PageExtensionDjangoModelFactory(factory.django.DjangoModelFactory):
    """
    Factories for page extensions have in common that:
    - they must create a related page with a title,
    - the related page may have to be placed below a "parent" page,
    - we may want to test the related page in several languages.

    All this is mutualized by inheriting from the present class.
    """

    @factory.lazy_attribute
    def extended_object(self):
        """
        Automatically create a related page with the title (or random title if None) in all the
        requested languages
        """
        title = getattr(self, "page_title", None)
        languages = getattr(self, "page_languages", None)
        if not title:
            # Create realistic titles in each language with faker
            languages = languages or [settings.LANGUAGE_CODE]
            title = {
                language: factory.Faker("catch_phrase").evaluate(
                    None, None, {"locale": language}
                )
                for language in languages
            }

        return create_i18n_page(
            title,
            in_navigation=getattr(self, "page_in_navigation", False),
            languages=languages,
            parent=getattr(self, "page_parent", None),
            reverse_id=getattr(self, "page_reverse_id", None),
            template=getattr(self, "page_template", None),
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
