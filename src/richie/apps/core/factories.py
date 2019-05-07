"""
Core factories
"""
import io
import os

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.core.files import File
from django.utils.text import slugify

import factory
from cms import models as cms_models
from cms.utils import get_current_site
from filer.models.imagemodels import Image

from ..core.helpers import create_i18n_page, get_permissions


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

    codename = factory.Sequence("permission_{:d}".format)
    content_type = factory.Iterator(ContentType.objects.all())
    name = factory.Sequence("permission #{:d}".format)


class TitleFactory(factory.django.DjangoModelFactory):
    """Create random title objects for CMS pages."""

    language = factory.Iterator([l[0] for l in settings.LANGUAGES])
    page = None
    slug = factory.LazyAttribute(lambda o: slugify(o.title))
    title = factory.Faker("catch_phrase")

    class Meta:
        model = cms_models.Title


class PageFactory(factory.django.DjangoModelFactory):
    """Create random CMS pages."""

    changed_by = factory.LazyAttribute(lambda o: slugify(o.user.username))
    created_by = factory.LazyAttribute(lambda o: slugify(o.user.username))
    title = factory.RelatedFactory(TitleFactory, "page")

    # Utility fields
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


class FilerImageFactory(factory.django.DjangoModelFactory):
    """
    Create a Filer Image for filer.fields.image.FilerImageField.
    """

    class Meta:
        model = Image

    owner = factory.SubFactory(UserFactory)
    original_filename = factory.Faker("file_name", category="image")

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
        # ImageField (both django's and factory_boy's) require PIL.
        # Try to import it along one of its known installation paths.
        try:
            from PIL import Image as PILimage
        except ImportError:
            import Image as PILimage

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
        return create_i18n_page(
            in_navigation=getattr(self, "page_in_navigation", False),
            languages=getattr(self, "page_languages", None),
            parent=getattr(self, "page_parent", None),
            reverse_id=getattr(self, "page_reverse_id", None),
            template=getattr(self, "page_template", None),
            title=getattr(self, "page_title", None),
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
