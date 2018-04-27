"""
CMS Wizard to add a course page
"""
from django import forms
from django.template.defaultfilters import slugify
from django.utils.translation import get_language, ugettext_lazy as _

from cms.api import create_page
from cms.forms.wizards import SlugWidget
from cms.models import Page
from cms.wizards.wizard_base import Wizard
from cms.wizards.wizard_pool import wizard_pool

from .models import (
    Course,
    CoursePage,
    CourseSubject,
    CourseSubjectPage,
    COURSES_PAGE_REVERSE_ID,
    COURSE_SUBJECTS_PAGE_REVERSE_ID,
)


# pylint:disable=duplicate-code
class CourseWizardForm(forms.Form):
    """
    This form is used by the wizard that creates a new course page.
    A related Course model is created for each course page.
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
    active_session = forms.CharField(
        max_length=200,
        empty_value=None,
        required=False,
        widget=forms.TextInput(),
        label=_("Course key"),
        help_text=_("Course key of the active session"),
    )

    def clean(self):
        """
        Ensure that the slug field is set or derive it from the title
        """
        cleaned_data = super().clean()
        # If the slug is not explicitly set, generate it from the title
        if cleaned_data.get("title") and not cleaned_data.get("slug"):
            cleaned_data["slug"] = slugify(cleaned_data["title"])[:200]

        return cleaned_data

    def clean_slug(self):
        """
            A page `path` is limited to 255 chars, therefore coursepage slug should
            always be shorter than (255 - parent's page one) + slash
        """
        parent_page = Page.objects.filter(
            reverse_id=COURSES_PAGE_REVERSE_ID, publisher_is_draft=True
        ).first()
        if not parent_page:
            raise forms.ValidationError(
                _(
                    "You must first create a `search` page and set its `reverse_id` to "
                    "`{reverse}`.".format(reverse=COURSES_PAGE_REVERSE_ID)
                )
            )
        if len(parent_page.get_slug()) + len(self.cleaned_data["slug"]) > 254:
            raise forms.ValidationError(
                _(
                    "Slug size is too long ({slug_size}) regarding parent's page one "
                    "({parent_slug_size}) you have 255 for both".format(
                        slug_size=len(self.cleaned_data["slug"]),
                        parent_slug_size=len(parent_page.get_slug()),
                    )
                )
            )
        return self.cleaned_data["slug"]

    def clean_active_session(self):
        """Ensure an other CoursePage for this course does not already exist."""

        if (
            self.cleaned_data.get("active_session")
            and CoursePage.objects.filter(
                course__active_session=self.cleaned_data["active_session"]
            ).exists()
        ):
            raise forms.ValidationError(
                _("A course page for a course with this key already exists")
            )

        return self.cleaned_data["active_session"]

    def save(self):
        """
        Create the course page and its related Course model
        """
        # We checked in the "clean" method that the parent page exists. Let's retrieve it:
        parent = Page.objects.get(
            reverse_id=COURSES_PAGE_REVERSE_ID, publisher_is_draft=True
        )
        # Create the Course
        course = Course.objects.create(
            name=self.cleaned_data["title"],
            active_session=self.cleaned_data["active_session"],
        )

        # Create the course CMS page
        page = create_page(
            title=self.cleaned_data["title"],
            slug=self.cleaned_data["slug"],
            language=get_language(),
            parent=parent,
            template="courses/cms/course_detail.html",
            published=False,  # The creation wizard should not publish the page
        )
        # Create the course page extension
        CoursePage.objects.create(extended_object=page, course=course)

        return page


class CourseWizard(Wizard):
    """Inherit from Wizard because each wizard must have its own Python class."""
    pass


wizard_pool.register(
    CourseWizard(
        title=_("New course page"),
        description=_("Create a new course page"),
        model=Course,
        form=CourseWizardForm,
        weight=200,
    )
)


class CourseSubjectWizardForm(forms.Form):
    """
    This form is used by the wizard that creates a new course subject page.
    The CourseSubject has to already exist.
    """
    title = forms.CharField(
        max_length=255,
        required=False,
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
    course_subject = forms.ChoiceField(
        required=True,
        label=_("Course subject"),
        help_text=_("Choose an existing subject for this page"),
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        course_subjects = CourseSubject.objects.filter(
            course_subject_pages__isnull=True
        )
        # pylint: disable=not-an-iterable
        self.fields["course_subject"].choices = [
            (course_subject.id, course_subject.name)
            for course_subject in course_subjects
        ]

    def clean(self):
        """
        Ensure that the slug field is set or derive it from the title
        """
        cleaned_data = super().clean()

        # if title is not explicitely set, use CourseSubject's name
        if not self.cleaned_data.get("title"):
            course_subject = CourseSubject.objects.get(
                id=self.cleaned_data["course_subject"]
            )
            self.cleaned_data["title"] = course_subject.name

        # If the slug is not explicitly set, generate it from the title
        if cleaned_data.get("title") and not cleaned_data.get("slug"):
            cleaned_data["slug"] = slugify(cleaned_data["title"])[:200]

        return cleaned_data

    def clean_slug(self):
        """
            A page `path` is limited to 255 chars, therefore coursepage slug should
            always be shorter than (255 - parent's page one) + slash
        """
        parent_page = Page.objects.filter(
            reverse_id=COURSE_SUBJECTS_PAGE_REVERSE_ID, publisher_is_draft=True
        ).first()
        if not parent_page:
            raise forms.ValidationError(
                _(
                    "You must first create a `subjects` page and set its `reverse_id` to "
                    "`{reverse}`.".format(reverse=COURSE_SUBJECTS_PAGE_REVERSE_ID)
                )
            )
        if len(parent_page.get_slug()) + len(self.cleaned_data["slug"]) > 254:
            raise forms.ValidationError(
                _(
                    "Slug size is too long ({slug_size}) regarding parent's page one "
                    "({parent_slug_size}) you have 255 for both".format(
                        slug_size=len(self.cleaned_data["slug"]),
                        parent_slug_size=len(parent_page.get_slug()),
                    )
                )
            )
        return self.cleaned_data["slug"]

    def save(self):
        """
        Create the course subject page and its related CourseSubject model
        """
        # We checked in the "clean" method that the parent page exists. Let's retrieve it:
        parent = Page.objects.get(
            reverse_id=COURSE_SUBJECTS_PAGE_REVERSE_ID, publisher_is_draft=True
        )
        # get the course subject
        course_subject = CourseSubject.objects.get(
            id=self.cleaned_data["course_subject"]
        )

        # Create the course subject CMS page
        page = create_page(
            title=self.cleaned_data["title"],
            slug=self.cleaned_data["slug"],
            language=get_language(),
            parent=parent,
            template="courses/cms/course_subject_detail.html",
            published=False,  # The creation wizard should not publish the page
        )
        # Create the course page extension
        CourseSubjectPage.objects.create(
            extended_object=page, course_subject=course_subject
        )

        return page


class CourseSubjectWizard(Wizard):
    """Inherit from Wizard because each wizard must have its own Python class."""
    pass


wizard_pool.register(
    CourseSubjectWizard(
        title=_("New course subject page"),
        description=_("Create a new course subject page"),
        model=Course,
        form=CourseSubjectWizardForm,
        weight=200,
    )
)
