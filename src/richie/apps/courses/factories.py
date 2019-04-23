"""
Courses factories
"""
import random
from collections import namedtuple
from datetime import datetime, timedelta

from django.utils import timezone
from django.utils.translation import get_language

import factory
import pytz
from cms.api import add_plugin

from ..core.defaults import ALL_LANGUAGES
from ..core.factories import (
    FilerImageFactory,
    PageExtensionDjangoModelFactory,
    image_getter,
)
from ..core.helpers import create_text_plugin
from .models import (
    BlogPost,
    Category,
    Course,
    CourseRun,
    Licence,
    Organization,
    Person,
    PersonTitle,
    PersonTitleTranslation,
)

VideoSample = namedtuple("VideoSample", ["label", "image", "url"])

VIDEO_SAMPLE_LINKS = (
    VideoSample(
        "Anant Agarwal: Why massively open online courses (still) matter",
        "cover1.jpg",
        "//www.youtube.com/embed/rYwTA5RA9eU",
    ),
    VideoSample(
        "Installing Open edX", "cover2.jpg", "//www.youtube.com/embed/YDm6bAPxeg0"
    ),
    VideoSample(
        "Open edX Conference 2018 Opening and Welcome remarks",
        "cover3.jpg",
        "//www.youtube.com/embed/zzx6MgBAbCc",
    ),
)


class BLDPageExtensionDjangoModelFactory(PageExtensionDjangoModelFactory):
    """
    This mixin mutualizes filling placeholders for banner, logo and description fields because
    several models share these 3 placeholders.
    """

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_banner(self, create, extracted, **kwargs):
        """
        Add a banner with a random image
        """
        if create and extracted:
            banner_placeholder = self.extended_object.placeholders.get(slot="banner")

            if isinstance(extracted, str):
                banner = image_getter(extracted)
            elif callable(extracted):
                banner = image_getter(extracted())
            else:
                banner = FilerImageFactory(original_filename="banner.jpg")

            for language in self.extended_object.get_languages():
                add_plugin(
                    language=language,
                    placeholder=banner_placeholder,
                    plugin_type="PicturePlugin",
                    picture=banner,
                    attributes={"alt": "banner image"},
                )

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_logo(self, create, extracted, **kwargs):
        """
        Add a logo with a random image
        """
        if create and extracted:
            logo_placeholder = self.extended_object.placeholders.get(slot="logo")

            if isinstance(extracted, str):
                logo = image_getter(extracted)
            elif callable(extracted):
                logo = image_getter(extracted())
            else:
                logo = FilerImageFactory(original_filename="logo.jpg")

            for language in self.extended_object.get_languages():
                add_plugin(
                    language=language,
                    placeholder=logo_placeholder,
                    plugin_type="PicturePlugin",
                    picture=logo,
                    attributes={"alt": "logo image"},
                )

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_description(self, create, extracted, **kwargs):
        """
        Add a text plugin for description with a long random text
        """
        if create and extracted:
            create_text_plugin(
                self.extended_object,
                "description",
                nb_paragraphs=random.randint(2, 4),
                languages=self.extended_object.get_languages(),
            )


class OrganizationFactory(BLDPageExtensionDjangoModelFactory):
    """
    A factory to automatically generate random yet meaningful organization page extensions
    in our tests.
    """

    class Meta:
        model = Organization
        exclude = [
            "page_in_navigation",
            "page_languages",
            "page_parent",
            "page_reverse_id",
            "page_template",
            "page_title",
        ]

    # fields concerning the related page
    page_template = Organization.TEMPLATE_DETAIL

    @factory.lazy_attribute_sequence
    def code(self, sequence):
        """
        Since `name` is required, let's just slugify it to get a meaningful code (and keep it
        below 100 characters)
        """
        return "{:s}-{:d}".format(self.extended_object.get_slug()[:90], sequence)

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_courses(self, create, extracted, **kwargs):
        """
        Add plugins for this organization to each course in the given list of course instances.
        """

        if create and extracted:
            for course in extracted:
                placeholder = course.extended_object.placeholders.get(
                    slot="course_organizations"
                )
                for language in self.extended_object.get_languages():

                    add_plugin(
                        language=language,
                        placeholder=placeholder,
                        plugin_type="OrganizationPlugin",
                        **{"page": self.extended_object},
                    )


class CourseFactory(PageExtensionDjangoModelFactory):
    """
    A factory to automatically generate random yet meaningful course page extensions
    and their related page in our tests.
    """

    class Meta:
        model = Course
        exclude = [
            "page_in_navigation",
            "page_languages",
            "page_parent",
            "page_template",
            "page_title",
        ]

    # fields concerning the related page
    page_template = Course.TEMPLATE_DETAIL

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_teaser(self, create, extracted, **kwargs):
        """
        Add a video plugin for teaser with a random url
        """

        if create and extracted:
            for language in self.extended_object.get_languages():

                placeholder = self.extended_object.placeholders.get(
                    slot="course_teaser"
                )

                video_sample = (
                    extracted
                    if isinstance(extracted, VideoSample)
                    else random.choice(VIDEO_SAMPLE_LINKS)
                )

                add_plugin(
                    language=language,
                    placeholder=placeholder,
                    plugin_type="VideoPlayerPlugin",
                    label=video_sample.label,
                    embed_link=video_sample.url,
                )

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_cover(self, create, extracted, **kwargs):
        """
        Add a picture plugin for course cover with a random image
        """
        if create and extracted:
            cover_placeholder = self.extended_object.placeholders.get(
                slot="course_cover"
            )

            if isinstance(extracted, str):
                cover = image_getter(extracted)
            elif callable(extracted):
                cover = image_getter(extracted())
            else:
                cover = FilerImageFactory(original_filename="cover.jpg")

            for language in self.extended_object.get_languages():
                add_plugin(
                    language=language,
                    placeholder=cover_placeholder,
                    plugin_type="PicturePlugin",
                    picture=cover,
                    attributes={"alt": "cover image"},
                )

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_team(self, create, extracted, **kwargs):
        """
        Add person plugin for course team from given person instance list
        """

        if create and extracted:
            for language in self.extended_object.get_languages():
                placeholder = self.extended_object.placeholders.get(slot="course_team")

                for person in extracted:
                    add_plugin(
                        language=language,
                        placeholder=placeholder,
                        plugin_type="PersonPlugin",
                        **{"page": person.extended_object},
                    )

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_categories(self, create, extracted, **kwargs):
        """
        Add categories plugin to course from a given list of category instances.
        """

        if create and extracted:
            for language in self.extended_object.get_languages():
                placeholder = self.extended_object.placeholders.get(
                    slot="course_categories"
                )

                for category in extracted:
                    add_plugin(
                        language=language,
                        placeholder=placeholder,
                        plugin_type="CategoryPlugin",
                        **{"page": category.extended_object},
                    )

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_organizations(self, create, extracted, **kwargs):
        """
        Add organizations plugin to course from a given list of organization instances.
        """

        if create and extracted:
            for language in self.extended_object.get_languages():
                placeholder = self.extended_object.placeholders.get(
                    slot="course_organizations"
                )

                for organization in extracted:
                    add_plugin(
                        language=language,
                        placeholder=placeholder,
                        plugin_type="OrganizationPlugin",
                        **{"page": organization.extended_object},
                    )

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_licences(self, create, extracted, **kwargs):
        """
        Add licence plugin for course licence placeholders from given licence
        instance list
        """
        if create and extracted:
            for language in self.extended_object.get_languages():
                for slot, licence in extracted:
                    placeholder = self.extended_object.placeholders.get(slot=slot)
                    add_plugin(
                        language=language,
                        placeholder=placeholder,
                        plugin_type="LicencePlugin",
                        **{"licence": licence},
                    )

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_texts(self, create, extracted, **kwargs):
        """
        A shortand to fill some placeholder content with a text plugin.

        Placeholder slot names to fill are given from ``extracted`` argument
        in a list of slot names.
        """
        if create and extracted:
            for slot in extracted:
                create_text_plugin(
                    self.extended_object,
                    slot,
                    nb_paragraphs=1,
                    languages=self.extended_object.get_languages(),
                )


class CourseRunFactory(PageExtensionDjangoModelFactory):
    """
    A factory to automatically generate random yet meaningful course runs in our tests.

    Random dates are proposed realistically so that:
        - now <= start
        - enrollment_start <= start <= end
        - enrollment_start <= enrollment_end <= end
    """

    class Meta:
        model = CourseRun
        exclude = [
            "page_in_navigation",
            "page_languages",
            "page_parent",
            "page_template",
            "page_title",
        ]

    # fields concerning the related page
    page_template = CourseRun.TEMPLATE_DETAIL
    page_title = factory.Sequence("session {:d}".format)

    resource_link = factory.Faker("uri")

    @factory.lazy_attribute
    def page_languages(self):
        """
        Try getting the list of languages from the parent page and default to None.
        """
        return (
            self.page_parent.get_languages()
            if getattr(self, "page_parent", None)
            else None
        )

    @factory.lazy_attribute
    def languages(self):
        """
        Try getting the list of languages from the parent page and default to a random set of
        languages from the complete list of Django supported languages.
        """
        return (
            self.parent.get_languages()
            if getattr(self, "parent", None)
            else [l[0] for l in random.sample(ALL_LANGUAGES, random.randint(1, 5))]
        )

    # pylint: disable=no-self-use
    @factory.lazy_attribute
    def start(self):
        """
        A start datetime for the course run is chosen randomly in the future (it can
        of course be forced if we want something else), then the other significant dates
        for the course run are chosen randomly in periods that make sense with this start date.
        """
        now = timezone.now()
        period = timedelta(days=200)
        return datetime.utcfromtimestamp(
            random.randrange(
                int((now - period).timestamp()), int((now + period).timestamp())
            )
        ).replace(tzinfo=pytz.utc)

    @factory.lazy_attribute
    def end(self):
        """
        The end datetime is at a random duration after the start datetme (we pick within 90 days).
        """
        if not self.start:
            return None
        period = timedelta(days=90)
        return datetime.utcfromtimestamp(
            random.randrange(
                int(self.start.timestamp()), int((self.start + period).timestamp())
            )
        ).replace(tzinfo=pytz.utc)

    @factory.lazy_attribute
    def enrollment_start(self):
        """
        The start of enrollment is a random datetime before the start datetime.
        """
        if not self.start:
            return None
        period = timedelta(days=90)
        return datetime.utcfromtimestamp(
            random.randrange(
                int((self.start - period).timestamp()), int(self.start.timestamp())
            )
        ).replace(tzinfo=pytz.utc)

    @factory.lazy_attribute
    def enrollment_end(self):
        """
        The end of enrollment is a random datetime between the start of enrollment
        and the end of the course.
        If the enrollment start and end datetimes have been forced to incoherent dates,
        then just don't set any end of enrollment...
        """
        if not self.start:
            return None
        enrollment_start = self.enrollment_start or self.start - timedelta(
            days=random.randint(1, 90)
        )
        max_enrollment_end = self.end or self.start + timedelta(
            days=random.randint(1, 90)
        )
        max_enrollment_end = max(
            enrollment_start + timedelta(hours=1), max_enrollment_end
        )
        return datetime.utcfromtimestamp(
            random.randrange(
                int(enrollment_start.timestamp()), int(max_enrollment_end.timestamp())
            )
        ).replace(tzinfo=pytz.utc)


class CategoryFactory(BLDPageExtensionDjangoModelFactory):
    """
    A factory to automatically generate random yet meaningful category page extensions
    and their related page in our tests.
    """

    class Meta:
        model = Category
        exclude = [
            "page_in_navigation",
            "page_languages",
            "page_parent",
            "page_reverse_id",
            "page_template",
            "page_title",
        ]

    # fields concerning the related page
    page_template = Category.TEMPLATE_DETAIL

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_courses(self, create, extracted, **kwargs):
        """
        Add plugins for this category to each course in the given list of course instances.
        """

        if create and extracted:
            for course in extracted:
                placeholder = course.extended_object.placeholders.get(
                    slot="course_categories"
                )
                for language in self.extended_object.get_languages():

                    add_plugin(
                        language=language,
                        placeholder=placeholder,
                        plugin_type="CategoryPlugin",
                        **{"page": self.extended_object},
                    )


class LicenceLogoImageFactory(FilerImageFactory):
    """Image field factory for Licence."""

    file = factory.django.ImageField()


class LicenceFactory(factory.django.DjangoModelFactory):
    """
    A factory to automatically generate random yet meaningful licences.
    """

    class Meta:
        model = Licence

    name = factory.Faker("sentence", nb_words=3)
    logo = factory.SubFactory(LicenceLogoImageFactory)
    url = factory.Faker("uri")
    content = factory.Faker("text", max_nb_chars=300)


class BlogPostFactory(PageExtensionDjangoModelFactory):
    """
    A factory to automatically generate random yet meaningful blogpost extensions
    in our tests.
    """

    class Meta:
        model = BlogPost
        exclude = [
            "page_in_navigation",
            "page_languages",
            "page_parent",
            "page_template",
            "page_title",
        ]

    # fields concerning the related page
    page_template = BlogPost.TEMPLATE_DETAIL

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_author(self, create, extracted, **kwargs):
        """
        Add person plugin for blog post author from given person instance list
        """

        if create and extracted:
            for language in self.extended_object.get_languages():
                placeholder = self.extended_object.placeholders.get(slot="author")

                for person in extracted:
                    add_plugin(
                        language=language,
                        placeholder=placeholder,
                        plugin_type="PersonPlugin",
                        **{"page": person.extended_object},
                    )

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_body(self, create, extracted, **kwargs):
        """
        Add a text plugin for body with a long random text
        """
        if create and extracted:
            create_text_plugin(
                self.extended_object,
                "body",
                nb_paragraphs=random.randint(4, 6),
                languages=self.extended_object.get_languages(),
                plugin_type="TextPlugin",
            )

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_categories(self, create, extracted, **kwargs):
        """
        Add categories plugin to blog post from a given list of category
        instances.
        """

        if create and extracted:
            for language in self.extended_object.get_languages():
                placeholder = self.extended_object.placeholders.get(slot="categories")

                for category in extracted:
                    add_plugin(
                        language=language,
                        placeholder=placeholder,
                        plugin_type="CategoryPlugin",
                        **{"page": category.extended_object},
                    )

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_cover(self, create, extracted, **kwargs):
        """
        Add a picture plugin for blog post cover with a random image
        """
        if create and extracted:
            cover_placeholder = self.extended_object.placeholders.get(slot="cover")

            if isinstance(extracted, str):
                cover = image_getter(extracted)
            elif callable(extracted):
                cover = image_getter(extracted())
            else:
                cover = FilerImageFactory(original_filename="cover.jpg")

            for language in self.extended_object.get_languages():
                add_plugin(
                    language=language,
                    placeholder=cover_placeholder,
                    plugin_type="PicturePlugin",
                    picture=cover,
                    attributes={"alt": "cover image"},
                )

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_excerpt(self, create, extracted, **kwargs):
        """
        Add a plain text plugin for excerpt with a short random text
        """
        if create and extracted:
            placeholder = self.extended_object.placeholders.get(slot="excerpt")

            for language in self.extended_object.get_languages():
                text = factory.Faker(
                    "text", max_nb_chars=random.randint(50, 100), locale=language
                ).generate({})
                add_plugin(
                    language=language,
                    placeholder=placeholder,
                    plugin_type="PlainTextPlugin",
                    body=text,
                )


class PersonTitleFactory(factory.django.DjangoModelFactory):
    """
    Factory to generate random yet realistic PersonTitle objects with one default translation.
    """

    translation = factory.RelatedFactory(
        "richie.apps.courses.factories.PersonTitleTranslationFactory", "master"
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
    def fill_categories(self, create, extracted, **kwargs):
        """Add categories plugin to person from a given list of category instances."""
        if create and extracted:
            for language in self.extended_object.get_languages():
                placeholder = self.extended_object.placeholders.get(slot="categories")

                for category in extracted:
                    add_plugin(
                        language=language,
                        placeholder=placeholder,
                        plugin_type="CategoryPlugin",
                        **{"page": category.extended_object},
                    )

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

            if isinstance(extracted, str):
                portrait = image_getter(extracted)
            elif callable(extracted):
                portrait = image_getter(extracted())
            else:
                portrait = FilerImageFactory(original_filename="portrait.jpg")

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

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_organizations(self, create, extracted, **kwargs):
        """
        Add organizations plugin to person from a given list of organization instances.
        """

        if create and extracted:
            for language in self.extended_object.get_languages():
                placeholder = self.extended_object.placeholders.get(
                    slot="organizations"
                )

                for organization in extracted:
                    add_plugin(
                        language=language,
                        placeholder=placeholder,
                        plugin_type="OrganizationPlugin",
                        **{"page": organization.extended_object},
                    )
