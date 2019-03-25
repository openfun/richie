"""
CMS Wizard to add a course page
"""
from django import forms
from django.conf import settings
from django.template.defaultfilters import slugify
from django.utils.functional import cached_property
from django.utils.translation import get_language
from django.utils.translation import ugettext_lazy as _

from cms.api import add_plugin, create_page
from cms.forms.wizards import SlugWidget
from cms.models import Page
from cms.wizards.wizard_base import Wizard
from cms.wizards.wizard_pool import wizard_pool

from .models import (
    BlogPost,
    Category,
    Course,
    CourseRun,
    Organization,
    Person,
    PersonTitle,
)


class BaseWizardForm(forms.Form):
    """
    Factorize the part of the wizard form that handles the title and the slug as they are
    common to all our wizard forms.
    """

    title = forms.CharField(
        max_length=255,
        required=True,
        widget=forms.TextInput(),
        label=_("Page title"),
        help_text=_("Title of the page in current language"),
    )
    slug = forms.CharField(
        max_length=200,  # Should be less than 255, the "max_length" of a Page's "path" field
        required=False,
        widget=SlugWidget(),
        label=_("Page slug"),
        help_text=_("Slug of the page in current language"),
    )

    def clean(self):
        """
        Ensure that the slug field is set or derive it from the title
        """
        cleaned_data = super().clean()

        # If the slug is not explicitly set, generate it from the title
        if cleaned_data.get("title") and not cleaned_data.get("slug"):
            cleaned_data["slug"] = slugify(cleaned_data["title"])[:200]

        # Check that the length of the slug is compatible with its parent page:
        #  a page `path` is limited to 255 chars, therefore the course page slug should
        # always be shorter than (255 - length of parent page path - 1 character for the "/")
        if self.parent_page:
            length = len(self.parent_page.get_path()) + 1 + len(cleaned_data["slug"])
            if length > 255:
                raise forms.ValidationError(
                    {
                        "slug": [
                            _(
                                "This slug is too long. The length of the path built by "
                                "prepending the slug of the parent page would be {:d} characters "
                                "long and it should be less than 255".format(length)
                            )
                        ]
                    }
                )

        return cleaned_data

    @cached_property
    def parent_page(self):
        """
        The parent page for each type of page is defined on its page extension model.
        """
        try:
            return Page.objects.get(
                reverse_id=self.model.ROOT_REVERSE_ID, publisher_is_draft=True
            )
        except Page.DoesNotExist:
            raise forms.ValidationError(
                {
                    "slug": [
                        _(
                            "You must first create a parent page and set its `reverse_id` to "
                            "`{reverse}`.".format(reverse=self.model.ROOT_REVERSE_ID)
                        )
                    ]
                }
            )

    def save(self):
        """
        Create the page with "title" and "slug"
        """
        return create_page(
            title=self.cleaned_data["title"],
            slug=self.cleaned_data["slug"],
            language=get_language(),
            parent=self.parent_page,
            template=self.model.TEMPLATE_DETAIL,
            published=False,  # The creation wizard should not publish the page
        )


class CourseWizardForm(BaseWizardForm):
    """
    This form is used by the wizard that creates a new course page.
    A related Course model is created for each course page.
    """

    organization = forms.ModelChoiceField(
        required=True,
        queryset=Organization.objects.filter(extended_object__publisher_is_draft=True),
        label=_("Organization"),
        help_text=_("The organization in charge of this course"),
    )

    model = Course

    def save(self):
        """
        The parent form created the page.
        This method creates the associated course page extension.
        """
        page = super().save()
        course = Course.objects.create(extended_object=page)
        # Add a plugin for the organization

        placeholder = course.extended_object.placeholders.get(
            slot="course_organizations"
        )
        add_plugin(
            language=get_language(),
            placeholder=placeholder,
            plugin_type="OrganizationPlugin",
            **{"page": self.cleaned_data["organization"].extended_object},
        )

        return page


class CourseWizard(Wizard):
    """Inherit from Wizard because each wizard must have its own Python class."""


wizard_pool.register(
    CourseWizard(
        title=_("New course page"),
        description=_("Create a new course page"),
        model=Course,
        form=CourseWizardForm,
        weight=200,
    )
)


class CourseRunWizardForm(BaseWizardForm):
    """
    This form is used by the wizard that creates a new course run page.
    A related CourseRun model is created for each course run page.
    """

    course = forms.ModelChoiceField(
        required=True,
        queryset=Course.objects.filter(
            extended_object__publisher_is_draft=True,
            # Only list the top level courses (not the snapshots)
            extended_object__node__parent__cms_pages__course__isnull=True,
        ).distinct(),
        label=_("Course"),
        help_text=_("The course that this course run describes."),
    )
    languages = forms.MultipleChoiceField(
        required=True,
        label=_("Languages"),
        choices=settings.ALL_LANGUAGES,
        help_text=_(
            "Select all the languages in which the course content is available."
        ),
    )
    resource_link = forms.URLField(label=_("Resource link"), required=False)

    model = CourseRun

    @cached_property
    def parent_page(self):
        """
        The parent page of a course run is the related course.
        """
        course = self.cleaned_data.get("course")
        return course.extended_object if course else None

    def save(self):
        """
        The parent form created the page.
        This method creates the associated course run page extension.
        """
        page = super().save()
        CourseRun.objects.create(
            extended_object=page,
            resource_link=self.cleaned_data["resource_link"],
            languages=self.cleaned_data["languages"],
        )
        return page


class CourseRunWizard(Wizard):
    """Inherit from Wizard because each wizard must have its own Python class."""


wizard_pool.register(
    CourseRunWizard(
        title=_("New course run page"),
        description=_("Create a new course run page"),
        model=CourseRun,
        form=CourseRunWizardForm,
        weight=200,
    )
)


class OrganizationWizardForm(BaseWizardForm):
    """
    This form is used by the wizard that creates a new organization page
    A related organization model is created for each organization page
    """

    model = Organization

    def save(self):
        """
        The parent form created the page.
        This method creates the associated organization.
        """
        page = super().save()
        Organization.objects.create(extended_object=page)
        return page


class OrganizationWizard(Wizard):
    """Inherit from Wizard because each wizard must have its own Python class."""


wizard_pool.register(
    OrganizationWizard(
        title=_("New Organization page"),
        description=_("Create a new Organization page"),
        model=Organization,
        form=OrganizationWizardForm,
        weight=200,
    )
)


class CategoryWizardForm(BaseWizardForm):
    """
    This form is used by the wizard that creates a new category page.
    A related Category model is created for each category page.
    """

    parent_category = forms.ModelChoiceField(
        required=False,
        queryset=Category.objects.filter(
            extended_object__publisher_is_draft=True
        ).order_by("extended_object__node__path"),
        label=_("Parent category"),
        help_text=_("Choose a parent if you are building a category tree."),
    )

    model = Category

    @cached_property
    def parent_page(self):
        """
        The parent page may be defined in the form but defaults to the categories root page
        defined by the `ROOT_REVERSE_ID` property of the Category model.
        """
        parent_category = self.cleaned_data.get("parent_category")
        return (
            parent_category.extended_object if parent_category else super().parent_page
        )

    def save(self):
        """
        The parent form created the page.
        This method creates the associated category page extension.
        """
        page = super().save()
        Category.objects.create(extended_object=page)
        return page


class CategoryWizard(Wizard):
    """Inherit from Wizard because each wizard must have its own Python class."""


wizard_pool.register(
    CategoryWizard(
        title=_("New category page"),
        description=_("Create a new category page"),
        model=Category,
        form=CategoryWizardForm,
        weight=200,
    )
)


class BlogPostWizardForm(BaseWizardForm):
    """
    This form is used by the wizard that creates a new blog post
    A related blogpost model is created for each blog post
    """

    model = BlogPost

    def save(self):
        """
        The parent form created the page.
        This method creates the associated blogpost.
        """
        page = super().save()
        BlogPost.objects.create(extended_object=page)
        return page


class BlogPostWizard(Wizard):
    """Inherit from Wizard because each wizard must have its own Python class."""


wizard_pool.register(
    BlogPostWizard(
        title=_("New blog post"),
        description=_("Create a new blog post"),
        model=BlogPost,
        form=BlogPostWizardForm,
        weight=200,
    )
)


class PersonWizardForm(BaseWizardForm):
    """
    This form is used by the wizard that creates a new person page.
    A related Person model is created for each person page.
    """

    person_title = forms.ModelChoiceField(
        required=True,
        queryset=PersonTitle.objects.all(),
        label=_("Title"),
        help_text=_("Choose this person's title among existing ones"),
    )
    first_name = forms.CharField(
        max_length=200, widget=forms.TextInput(), label=_("First Name")
    )
    last_name = forms.CharField(
        max_length=200, widget=forms.TextInput(), label=_("Last Name")
    )

    model = Person

    def save(self):
        """
        The parent form created the page.
        This method creates the associated person page extension.
        """
        page = super().save()
        Person.objects.create(
            extended_object=page,
            person_title=self.cleaned_data["person_title"],
            first_name=self.cleaned_data["first_name"],
            last_name=self.cleaned_data["last_name"],
        )
        return page


class PersonWizard(Wizard):
    """Inherit from Wizard because each wizard must have its own Python class."""


wizard_pool.register(
    PersonWizard(
        title=_("New person page"),
        description=_("Create a new person page"),
        model=Person,
        form=PersonWizardForm,
        weight=200,
    )
)
