"""
Courses factories
"""
from django.utils.text import slugify

from cms.api import create_page
import factory

from .models import Course, Organization, Subject


class OrganizationFactory(factory.django.DjangoModelFactory):
    """
    A factory to automatically generate random yet meaningful organization page extensions
    in our tests.
    """

    class Meta:
        model = Organization
        exclude = ["parent", "title"]

    logo = factory.django.ImageField(width=180, height=100)
    parent = None
    title = factory.Faker("company")

    @factory.lazy_attribute
    def extended_object(self):
        """
        Automatically create a related page with the random title
        """
        return create_page(
            self.title,
            "courses/cms/organization_detail.html",
            settings.LANGUAGE_CODE,
            parent=self.parent,
        )

    @factory.lazy_attribute
    def code(self):
        """
        Since `name` is required, let's just slugify it to get a meaningful code (and keep it
        below 100 characters)
        """
        return slugify(self.title)[:100]

    @factory.post_generation
    # pylint: disable=unused-argument, attribute-defined-outside-init, no-member
    def with_courses(self, create, extracted, **kwargs):
        """Add courses to ManyToMany relation."""
        if create and extracted:
            self.courses.set(extracted)


class CourseFactory(factory.django.DjangoModelFactory):
    """
    A factory to automatically generate random yet meaningful course page extensions
    and their related page in our tests.

    The `active_session` field is set to a realistic Splitmongo course key in Open edX which
    matches the following pattern:

        {version}:{organization_code}+{number}+{session}

        e.g. "course-v1:CNAM+01032+session01"
    """

    class Meta:
        model = Course
        exclude = ["number", "session", "title", "version"]

    title = factory.Faker("catch_phrase")

    version = factory.Sequence(lambda n: "version-v{version}".format(version=n + 1))
    number = factory.Faker("numerify", text="#####")
    session = factory.Sequence(lambda n: "session{session:02d}".format(session=n + 1))

    active_session = factory.LazyAttribute(
        lambda o: "{version}:{organization_code}+{number}+{session}".format(
            version=o.version,
            organization_code=o.main_organization.code
            if o.main_organization
            else "xyz",
            number=o.number,
            session=o.session,
        )
    )
    main_organization = factory.SubFactory(OrganizationFactory)

    @factory.lazy_attribute
    def extended_object(self):
        """
        Automatically create a related page with the random title
        """
        return create_page(self.title, Course.TEMPLATE_DETAIL, settings.LANGUAGE_CODE)

    @factory.post_generation
    # pylint: disable=unused-argument, attribute-defined-outside-init, no-member
    def with_subjects(self, create, extracted, **kwargs):
        """Add subjects to ManyToMany relation."""
        if create and extracted:
            self.subjects.set(extracted)

    @factory.post_generation
    # pylint: disable=unused-argument, attribute-defined-outside-init
    def with_organizations(self, create, extracted, **kwargs):
        """Add organizations to ManyToMany relation."""
        if create and extracted:
            self.organizations.set(extracted)


class SubjectFactory(factory.django.DjangoModelFactory):
    """
    A factory to automatically generate random yet meaningful subject page extensions
    and their related page in our tests.
    """

    class Meta:
        model = Subject
        exclude = ["title"]

    title = factory.Faker("catch_phrase")

    @factory.lazy_attribute
    def extended_object(self):
        """
        Automatically create a related page with the random title
        """
        return create_page(self.title, Subject.TEMPLATE_DETAIL, settings.LANGUAGE_CODE)

    @factory.post_generation
    # pylint: disable=unused-argument, attribute-defined-outside-init, no-member
    def with_courses(self, create, extracted, **kwargs):
        """Add courses to ManyToMany relation."""
        if create and extracted:
            self.courses.set(extracted)
