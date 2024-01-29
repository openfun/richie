"""
Unit tests for the Category model
"""

# pylint: disable=too-many-lines
from django.test import TestCase
from django.test.utils import override_settings
from django.utils import translation

from cms.api import add_plugin, create_page

from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses.cms_plugins import CategoryPlugin
from richie.apps.courses.factories import (
    BlogPostFactory,
    CategoryFactory,
    CourseFactory,
    OrganizationFactory,
    PersonFactory,
)
from richie.apps.courses.models import BlogPost, Category, Course, Organization, Person


# pylint: disable=too-many-public-methods
class CategoryModelsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Category model
    """

    def test_models_category_str(self):
        """
        The string representation should be built with the title of the related page
        and its ancestors as long as they are category page.
        """
        not_a_category_page = create_page(
            "Categories", "richie/single_column.html", "en"
        )

        # Art
        page = create_page(
            "Art", "courses/cms/category_detail.html", "en", parent=not_a_category_page
        )
        category = CategoryFactory(extended_object=page)
        with self.assertNumQueries(4):
            self.assertEqual(str(category), "Art")

        # Art / Literature
        child_page = create_page(
            "Literature", "courses/cms/category_detail.html", "en", parent=page
        )
        child_category = CategoryFactory(extended_object=child_page)
        with self.assertNumQueries(5):
            self.assertEqual(str(child_category), "Art / Literature")

        # Art / Literature / Novels
        leaf_page = create_page(
            "Novels", "courses/cms/category_detail.html", "en", parent=child_page
        )
        leaf_category = CategoryFactory(extended_object=leaf_page)
        with self.assertNumQueries(6):
            self.assertEqual(str(leaf_category), "Art / Literature / Novels")

    def test_models_category_get_meta_category(self):
        """
        Categories provide a method to independently get their (public) meta category without
        any additional information.
        """
        # A root page that's the parent for all our categories
        not_a_category_page = create_page(
            "Categories", "richie/single_column.html", "en", published=True
        )

        # Our meta category and its page
        meta_category_page = create_page(
            "Subjects",
            "courses/cms/category_detail.html",
            "en",
            parent=not_a_category_page,
            published=True,
        )
        meta_category = CategoryFactory(
            extended_object=meta_category_page, should_publish=True
        )
        # Meta categories do not have a meta category themselves
        with self.assertRaises(Category.DoesNotExist):
            meta_category.get_meta_category()

        # Create a category that falls under our meta category
        category_page = create_page(
            "Literature",
            "courses/cms/category_detail.html",
            "en",
            parent=meta_category_page,
            published=True,
        )
        category = CategoryFactory(extended_object=category_page, should_publish=True)
        self.assertEqual(
            category.public_extension.get_meta_category(),
            meta_category.public_extension,
        )
        self.assertEqual(category.get_meta_category(), meta_category)

        # We can still retrieve the meta category for a more deeply nested category
        child_category_page = create_page(
            "XVIIIth century Literature",
            "courses/cms/category_detail.html",
            "en",
            parent=category_page,
            published=True,
        )
        child_category = CategoryFactory(
            extended_object=child_category_page, should_publish=True
        )
        self.assertEqual(
            child_category.public_extension.get_meta_category(),
            meta_category.public_extension,
        )
        self.assertEqual(child_category.get_meta_category(), meta_category)

    # get_es_id
    def test_get_es_id_for_draft_category_with_public_extension(self):
        """
        A draft category with a public extension. Its ES ID is the ID of the page linked to the
        public extension.
        """
        category = CategoryFactory(should_publish=True)
        self.assertEqual(
            category.get_es_id(), str(category.public_extension.extended_object_id)
        )

    def test_get_es_id_for_published_category(self):
        """
        A published category. Its ES ID is the ID of the page linked to it.
        """
        category = CategoryFactory(should_publish=True)
        self.assertEqual(
            category.public_extension.get_es_id(),
            str(category.public_extension.extended_object_id),
        )

    def test_get_es_id_for_draft_category_with_no_public_extension(self):
        """
        A draft category with no public extension. It has no ES ID.
        """
        category = CategoryFactory()
        self.assertEqual(category.get_es_id(), None)

    # get_courses

    def test_models_category_get_courses_queries(self):
        """
        It should be possible to retrieve the list of related courses on the category instance.
        The number of queries should be minimal.
        """
        category = CategoryFactory(should_publish=True)
        courses = CourseFactory.create_batch(
            3, page_title="my title", fill_categories=[category], should_publish=True
        )
        retrieved_courses = category.get_courses()

        with self.assertNumQueries(2):
            self.assertEqual(list(retrieved_courses), courses)

        with self.assertNumQueries(0):
            for course in retrieved_courses:
                self.assertEqual(
                    course.extended_object.prefetched_titles[0].title, "my title"
                )

    def test_models_category_get_courses_ordering(self):
        """The related courses should be sorted by their position in the pages tree."""
        category = CategoryFactory(should_publish=True)
        course1, course2, course3 = CourseFactory.create_batch(
            3, fill_categories=[category], should_publish=True
        )
        self.assertEqual(list(category.get_courses()), [course1, course2, course3])

        # Move pages in the tree and check that they are returned in the new order
        course3.extended_object.move_page(course1.extended_object.node, position="left")
        self.assertEqual(list(category.get_courses()), [course3, course1, course2])

        course1.extended_object.move_page(course3.extended_object.node, position="left")
        self.assertEqual(list(category.get_courses()), [course1, course3, course2])

    def test_models_category_get_courses_descendants(self):
        """
        Related courses should include the courses linked to the category's descendants,
        unless specifically deactivated by the "include_descendants" argument.
        """
        category_page = create_page(
            "Subjects", "courses/cms/category_detail.html", "en", published=True
        )
        category = CategoryFactory(extended_object=category_page, should_publish=True)
        courses = CourseFactory.create_batch(
            2, fill_categories=[category], should_publish=True
        )

        child_category_page = create_page(
            "Literature",
            "courses/cms/category_detail.html",
            "en",
            parent=category_page,
            published=True,
        )
        child_category = CategoryFactory(
            extended_object=child_category_page, should_publish=True
        )
        courses_child = CourseFactory.create_batch(
            2, fill_categories=[child_category], should_publish=True
        )

        grand_child_category_page = create_page(
            "Literature",
            "courses/cms/category_detail.html",
            "en",
            parent=child_category_page,
            published=True,
        )
        grand_child_category = CategoryFactory(
            extended_object=grand_child_category_page, should_publish=True
        )
        courses_grand_child = CourseFactory.create_batch(
            2, fill_categories=[grand_child_category], should_publish=True
        )

        # Check that each category gets courses from its descendants
        # ...unless we pass an argument to deactivate it
        self.assertEqual(
            list(category.get_courses()), courses + courses_child + courses_grand_child
        )
        self.assertEqual(list(category.get_courses(include_descendants=False)), courses)

        self.assertEqual(
            list(child_category.get_courses()), courses_child + courses_grand_child
        )
        self.assertEqual(
            list(child_category.get_courses(include_descendants=False)), courses_child
        )

        self.assertEqual(
            list(grand_child_category.get_courses(include_descendants=False)),
            courses_grand_child,
        )
        self.assertEqual(list(grand_child_category.get_courses()), courses_grand_child)

    def test_models_category_get_courses_language_fallback_draft(self):
        """
        Validate that the reverse courses lookup works as expected with language fallback
        on a draft page.
        """
        category1, category2, category3 = CategoryFactory.create_batch(
            3, should_publish=True
        )
        course = CourseFactory(should_publish=True)
        placeholder = course.extended_object.placeholders.get(slot="course_categories")
        cms_languages = {
            "default": {
                "public": True,
                "hide_untranslated": False,
                "redirect_on_fallback": False,
                "fallbacks": ["en", "fr", "de"],
            }
        }

        # Reverse plugin lookups should fallback up to the second priority language
        add_plugin(
            language="de",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category1.extended_object},
        )
        with override_settings(CMS_LANGUAGES=cms_languages):
            with translation.override("en"):
                self.assertEqual(list(category1.get_courses()), [course])
                self.assertEqual(list(category2.get_courses()), [])
                self.assertEqual(list(category3.get_courses()), [])

            with translation.override("fr"):
                self.assertEqual(list(category1.get_courses()), [course])
                self.assertEqual(list(category2.get_courses()), [])
                self.assertEqual(list(category3.get_courses()), [])

            with translation.override("de"):
                self.assertEqual(list(category1.get_courses()), [course])
                self.assertEqual(list(category2.get_courses()), [])
                self.assertEqual(list(category3.get_courses()), [])

        # Reverse plugin lookups should fallback to the first priority language if available
        # and ignore the second priority language unless it is the current language
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category2.extended_object},
        )
        with override_settings(CMS_LANGUAGES=cms_languages):
            with translation.override("en"):
                self.assertEqual(list(category1.get_courses()), [])
                self.assertEqual(list(category2.get_courses()), [course])
                self.assertEqual(list(category3.get_courses()), [])

            with translation.override("fr"):
                self.assertEqual(list(category1.get_courses()), [])
                self.assertEqual(list(category2.get_courses()), [course])
                self.assertEqual(list(category3.get_courses()), [])

            with translation.override("de"):
                self.assertEqual(list(category1.get_courses()), [course])
                self.assertEqual(list(category2.get_courses()), [])
                self.assertEqual(list(category3.get_courses()), [])

        # Reverse plugin lookups should stick to the current language if available and
        # ignore plugins on fallback languages
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category3.extended_object},
        )
        with override_settings(CMS_LANGUAGES=cms_languages):
            with translation.override("en"):
                self.assertEqual(list(category1.get_courses()), [])
                self.assertEqual(list(category2.get_courses()), [])
                self.assertEqual(list(category3.get_courses()), [course])

            with translation.override("fr"):
                self.assertEqual(list(category1.get_courses()), [])
                self.assertEqual(list(category2.get_courses()), [course])
                self.assertEqual(list(category3.get_courses()), [])

            with translation.override("de"):
                self.assertEqual(list(category1.get_courses()), [course])
                self.assertEqual(list(category2.get_courses()), [])
                self.assertEqual(list(category3.get_courses()), [])

    @override_settings(
        LANGUAGES=(("en", "en"), ("fr", "fr"), ("de", "de")),
        CMS_LANGUAGES={
            "default": {
                "public": True,
                "hide_untranslated": False,
                "redirect_on_fallback": False,
                "fallbacks": ["en", "fr", "de"],
            }
        },
    )
    # pylint: disable=too-many-statements
    def test_models_category_get_courses_language_fallback_published(self):
        """
        Validate that the reverse courses lookup works as expected with language fallback
        on a published page.
        """
        category1, category2, category3 = CategoryFactory.create_batch(
            3, should_publish=True
        )
        public_category1 = category1.public_extension
        public_category2 = category2.public_extension
        public_category3 = category3.public_extension

        course, course_unpublished = CourseFactory.create_batch(
            2, page_languages=["en", "fr", "de"], should_publish=True
        )

        public_course = course.public_extension

        public_course_unpublished = course_unpublished.public_extension
        course_unpublished.extended_object.unpublish("en")
        course_unpublished.extended_object.unpublish("fr")
        course_unpublished.extended_object.unpublish("de")

        placeholder = public_course.extended_object.placeholders.get(
            slot="course_categories"
        )
        placeholder_unpublished = (
            public_course_unpublished.extended_object.placeholders.get(
                slot="course_categories"
            )
        )
        # Reverse plugin lookups should fallback up to the second priority language
        add_plugin(
            language="de",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category1.extended_object},
        )
        add_plugin(
            language="de",
            placeholder=placeholder_unpublished,
            plugin_type="CategoryPlugin",
            **{"page": category1.extended_object},
        )

        with translation.override("en"):
            self.assertEqual(list(public_category1.get_courses()), [public_course])
            self.assertEqual(list(public_category2.get_courses()), [])
            self.assertEqual(list(public_category3.get_courses()), [])

        with translation.override("fr"):
            self.assertEqual(list(public_category1.get_courses()), [public_course])
            self.assertEqual(list(public_category2.get_courses()), [])
            self.assertEqual(list(public_category3.get_courses()), [])

        with translation.override("de"):
            self.assertEqual(list(public_category1.get_courses()), [public_course])
            self.assertEqual(list(public_category2.get_courses()), [])
            self.assertEqual(list(public_category3.get_courses()), [])

        # Reverse plugin lookups should fallback to the first priority language if available
        # and ignore the second priority language unless it is the current language
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category2.extended_object},
        )
        add_plugin(
            language="fr",
            placeholder=placeholder_unpublished,
            plugin_type="CategoryPlugin",
            **{"page": category2.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(public_category1.get_courses()), [])
            self.assertEqual(list(public_category2.get_courses()), [public_course])
            self.assertEqual(list(public_category3.get_courses()), [])

        with translation.override("fr"):
            self.assertEqual(list(public_category1.get_courses()), [])
            self.assertEqual(list(public_category2.get_courses()), [public_course])
            self.assertEqual(list(public_category3.get_courses()), [])

        with translation.override("de"):
            self.assertEqual(list(public_category1.get_courses()), [public_course])
            self.assertEqual(list(public_category2.get_courses()), [])
            self.assertEqual(list(public_category3.get_courses()), [])

        # Reverse plugin lookups should stick to the current language if available and
        # ignore plugins on fallback languages
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category3.extended_object},
        )
        add_plugin(
            language="en",
            placeholder=placeholder_unpublished,
            plugin_type="CategoryPlugin",
            **{"page": category3.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(public_category1.get_courses()), [])
            self.assertEqual(list(public_category2.get_courses()), [])
            self.assertEqual(list(public_category3.get_courses()), [public_course])

        with translation.override("fr"):
            self.assertEqual(list(public_category1.get_courses()), [])
            self.assertEqual(list(public_category2.get_courses()), [public_course])
            self.assertEqual(list(public_category3.get_courses()), [])

        with translation.override("de"):
            self.assertEqual(list(public_category1.get_courses()), [public_course])
            self.assertEqual(list(public_category2.get_courses()), [])
            self.assertEqual(list(public_category3.get_courses()), [])

    def test_models_category_get_courses_public_category_page(self):
        """
        When a category is added on a draft course, the course should not be visible on
        the public category page until the course is published.
        """
        category = CategoryFactory(should_publish=True)
        category_page = category.extended_object
        course = CourseFactory(page_title="my title", should_publish=True)
        course_page = course.extended_object

        # Add a category to the course but don't publish the modification
        placeholder = course_page.placeholders.get(slot="course_categories")
        add_plugin(placeholder, CategoryPlugin, "en", page=category_page)

        self.assertEqual(list(category.get_courses()), [course])
        self.assertEqual(list(category.public_extension.get_courses()), [])

        # Now publish the modification and check that the course is displayed
        # on the public category page
        course.extended_object.publish("en")
        self.assertEqual(
            list(category.public_extension.get_courses()), [course.public_extension]
        )

        # If the course is unpublished, it should not be displayed on the public
        # page anymore
        course_page.unpublish("en")
        self.assertEqual(list(category.get_courses()), [course])
        self.assertEqual(list(category.public_extension.get_courses()), [])

    def test_models_category_get_courses_several_languages(self):
        """
        The courses should not be duplicated if they exist in several languages.
        """
        category = CategoryFactory(should_publish=True)
        CourseFactory(
            page_title={"en": "my title", "fr": "mon titre"},
            fill_categories=[category],
            should_publish=True,
        )
        self.assertEqual(Course.objects.count(), 2)
        self.assertEqual(category.get_courses().count(), 1)

    def test_models_category_get_courses_snapshots(self):
        """
        Snapshot courses should be excluded from the list of courses returned.
        The new filter query we added to exclude snapshots should not create duplicates.
        Indeed, we had to add a "distinct" clause to the query so this test enforces it.
        """
        # We create a root page because it was responsible for duplicate results when the
        # distinct clause is not applied.
        # This is because of the clause "extended_object__node__parent__cms_pages__..."
        # which is there to exclude snapshots but also acts on the main course page and
        # checks its parent (so the root page) and the duplicate comes from the fact that
        # the parent has a draft and a public page... so "cms_pages" has a cardinality of 2
        root_page = create_i18n_page("my title", published=True)

        category = CategoryFactory(should_publish=True)
        course = CourseFactory(
            page_parent=root_page, fill_categories=[category], should_publish=True
        )
        CourseFactory(
            page_parent=course.extended_object,
            fill_categories=[category],
            should_publish=True,
        )

        self.assertEqual(Course.objects.count(), 4)
        self.assertEqual(category.get_courses().count(), 1)
        self.assertEqual(category.public_extension.get_courses().count(), 1)

    # get_blogposts

    def test_models_category_get_blogposts(self):
        """
        It should be possible to retrieve the list of related blogposts on the category
        instance. The number of queries should be minimal.
        """
        category = CategoryFactory(should_publish=True)
        blogposts = BlogPostFactory.create_batch(
            2, page_title="my title", fill_categories=[category], should_publish=True
        )
        retrieved_blogposts = category.get_blogposts()

        with self.assertNumQueries(2):
            self.assertEqual(set(retrieved_blogposts), set(blogposts))

        with self.assertNumQueries(0):
            for blogpost in retrieved_blogposts:
                self.assertEqual(
                    blogpost.extended_object.prefetched_titles[0].title, "my title"
                )

    def test_models_category_get_blogposts_ordering(self):
        """The related blogposts should be sorted by their position in the pages tree."""
        category = CategoryFactory(should_publish=True)
        blogpost1, blogpost2, blogpost3 = BlogPostFactory.create_batch(
            3, fill_categories=[category], should_publish=True
        )
        self.assertEqual(
            list(category.get_blogposts()), [blogpost1, blogpost2, blogpost3]
        )

        # Move pages in the tree and check that they are returned in the new order
        blogpost3.extended_object.move_page(
            blogpost1.extended_object.node, position="left"
        )
        self.assertEqual(
            list(category.get_blogposts()), [blogpost3, blogpost1, blogpost2]
        )

        blogpost1.extended_object.move_page(
            blogpost3.extended_object.node, position="left"
        )
        self.assertEqual(
            list(category.get_blogposts()), [blogpost1, blogpost3, blogpost2]
        )

    def test_models_category_get_blogposts_descendants(self):
        """
        Related blogposts should include the blogposts linked to the category's descendants,
        unless specifically deactivated by the "include_descendants" argument.
        """
        category_page = create_page(
            "Subjects", "courses/cms/category_detail.html", "en", published=True
        )
        category = CategoryFactory(extended_object=category_page, should_publish=True)
        blogposts = BlogPostFactory.create_batch(
            2, fill_categories=[category], should_publish=True
        )

        child_category_page = create_page(
            "Literature",
            "courses/cms/category_detail.html",
            "en",
            parent=category_page,
            published=True,
        )
        child_category = CategoryFactory(
            extended_object=child_category_page, should_publish=True
        )
        blogposts_child = BlogPostFactory.create_batch(
            2, fill_categories=[child_category], should_publish=True
        )

        grand_child_category_page = create_page(
            "Literature",
            "courses/cms/category_detail.html",
            "en",
            parent=child_category_page,
            published=True,
        )
        grand_child_category = CategoryFactory(
            extended_object=grand_child_category_page, should_publish=True
        )
        blogposts_grand_child = BlogPostFactory.create_batch(
            2, fill_categories=[grand_child_category], should_publish=True
        )

        # Check that each category gets blogposts from its descendants
        # ...unless we pass an argument to deactivate it
        self.assertEqual(
            list(category.get_blogposts()),
            blogposts + blogposts_child + blogposts_grand_child,
        )
        self.assertEqual(
            list(category.get_blogposts(include_descendants=False)), blogposts
        )

        self.assertEqual(
            list(child_category.get_blogposts()),
            blogposts_child + blogposts_grand_child,
        )
        self.assertEqual(
            list(child_category.get_blogposts(include_descendants=False)),
            blogposts_child,
        )

        self.assertEqual(
            list(grand_child_category.get_blogposts(include_descendants=False)),
            blogposts_grand_child,
        )
        self.assertEqual(
            list(grand_child_category.get_blogposts()), blogposts_grand_child
        )

    def test_models_category_get_blogposts_language_fallback_draft(self):
        """
        Validate that the reverse blogposts lookup works as expected with language fallback
        on a draft page.
        """
        category1, category2, category3 = CategoryFactory.create_batch(
            3, should_publish=True
        )
        blogpost = BlogPostFactory(should_publish=True)
        placeholder = blogpost.extended_object.placeholders.get(slot="categories")
        cms_languages = {
            "default": {
                "public": True,
                "hide_untranslated": False,
                "redirect_on_fallback": False,
                "fallbacks": ["en", "fr", "de"],
            }
        }

        # Reverse plugin lookups should fallback up to the second priority language
        add_plugin(
            language="de",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category1.extended_object},
        )
        with override_settings(CMS_LANGUAGES=cms_languages):
            with translation.override("en"):
                self.assertEqual(list(category1.get_blogposts()), [blogpost])
                self.assertEqual(list(category2.get_blogposts()), [])
                self.assertEqual(list(category3.get_blogposts()), [])

            with translation.override("fr"):
                self.assertEqual(list(category1.get_blogposts()), [blogpost])
                self.assertEqual(list(category2.get_blogposts()), [])
                self.assertEqual(list(category3.get_blogposts()), [])

            with translation.override("de"):
                self.assertEqual(list(category1.get_blogposts()), [blogpost])
                self.assertEqual(list(category2.get_blogposts()), [])
                self.assertEqual(list(category3.get_blogposts()), [])

        # Reverse plugin lookups should fallback to the first priority language if available
        # and ignore the second priority language unless it is the current language
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category2.extended_object},
        )
        with override_settings(CMS_LANGUAGES=cms_languages):
            with translation.override("en"):
                self.assertEqual(list(category1.get_blogposts()), [])
                self.assertEqual(list(category2.get_blogposts()), [blogpost])
                self.assertEqual(list(category3.get_blogposts()), [])

            with translation.override("fr"):
                self.assertEqual(list(category1.get_blogposts()), [])
                self.assertEqual(list(category2.get_blogposts()), [blogpost])
                self.assertEqual(list(category3.get_blogposts()), [])

            with translation.override("de"):
                self.assertEqual(list(category1.get_blogposts()), [blogpost])
                self.assertEqual(list(category2.get_blogposts()), [])
                self.assertEqual(list(category3.get_blogposts()), [])

        # Reverse plugin lookups should stick to the current language if available and
        # ignore plugins on fallback languages
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category3.extended_object},
        )
        with override_settings(CMS_LANGUAGES=cms_languages):
            with translation.override("en"):
                self.assertEqual(list(category1.get_blogposts()), [])
                self.assertEqual(list(category2.get_blogposts()), [])
                self.assertEqual(list(category3.get_blogposts()), [blogpost])

            with translation.override("fr"):
                self.assertEqual(list(category1.get_blogposts()), [])
                self.assertEqual(list(category2.get_blogposts()), [blogpost])
                self.assertEqual(list(category3.get_blogposts()), [])

            with translation.override("de"):
                self.assertEqual(list(category1.get_blogposts()), [blogpost])
                self.assertEqual(list(category2.get_blogposts()), [])
                self.assertEqual(list(category3.get_blogposts()), [])

    @override_settings(
        LANGUAGES=(("en", "en"), ("fr", "fr"), ("de", "de")),
        CMS_LANGUAGES={
            "default": {
                "public": True,
                "hide_untranslated": False,
                "redirect_on_fallback": False,
                "fallbacks": ["en", "fr", "de"],
            }
        },
    )
    # pylint: disable=too-many-statements
    def test_models_category_get_blogposts_language_fallback_published(self):
        """
        Validate that the reverse blogposts lookup works as expected with language fallback
        on a published page.
        """
        category1, category2, category3 = CategoryFactory.create_batch(
            3, should_publish=True
        )
        public_category1 = category1.public_extension
        public_category2 = category2.public_extension
        public_category3 = category3.public_extension

        blogpost, blogpost_unpublished = BlogPostFactory.create_batch(
            2, page_languages=["en", "fr", "de"], should_publish=True
        )

        public_blogpost = blogpost.public_extension

        public_blogpost_unpublished = blogpost_unpublished.public_extension
        blogpost_unpublished.extended_object.unpublish("en")
        blogpost_unpublished.extended_object.unpublish("fr")
        blogpost_unpublished.extended_object.unpublish("de")

        placeholder = public_blogpost.extended_object.placeholders.get(
            slot="categories"
        )
        placeholder_unpublished = (
            public_blogpost_unpublished.extended_object.placeholders.get(
                slot="categories"
            )
        )
        # Reverse plugin lookups should fallback up to the second priority language
        add_plugin(
            language="de",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category1.extended_object},
        )
        add_plugin(
            language="de",
            placeholder=placeholder_unpublished,
            plugin_type="CategoryPlugin",
            **{"page": category1.extended_object},
        )

        with translation.override("en"):
            self.assertEqual(list(public_category1.get_blogposts()), [public_blogpost])
            self.assertEqual(list(public_category2.get_blogposts()), [])
            self.assertEqual(list(public_category3.get_blogposts()), [])

        with translation.override("fr"):
            self.assertEqual(list(public_category1.get_blogposts()), [public_blogpost])
            self.assertEqual(list(public_category2.get_blogposts()), [])
            self.assertEqual(list(public_category3.get_blogposts()), [])

        with translation.override("de"):
            self.assertEqual(list(public_category1.get_blogposts()), [public_blogpost])
            self.assertEqual(list(public_category2.get_blogposts()), [])
            self.assertEqual(list(public_category3.get_blogposts()), [])

        # Reverse plugin lookups should fallback to the first priority language if available
        # and ignore the second priority language unless it is the current language
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category2.extended_object},
        )
        add_plugin(
            language="fr",
            placeholder=placeholder_unpublished,
            plugin_type="CategoryPlugin",
            **{"page": category2.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(public_category1.get_blogposts()), [])
            self.assertEqual(list(public_category2.get_blogposts()), [public_blogpost])
            self.assertEqual(list(public_category3.get_blogposts()), [])

        with translation.override("fr"):
            self.assertEqual(list(public_category1.get_blogposts()), [])
            self.assertEqual(list(public_category2.get_blogposts()), [public_blogpost])
            self.assertEqual(list(public_category3.get_blogposts()), [])

        with translation.override("de"):
            self.assertEqual(list(public_category1.get_blogposts()), [public_blogpost])
            self.assertEqual(list(public_category2.get_blogposts()), [])
            self.assertEqual(list(public_category3.get_blogposts()), [])

        # Reverse plugin lookups should stick to the current language if available and
        # ignore plugins on fallback languages
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category3.extended_object},
        )
        add_plugin(
            language="en",
            placeholder=placeholder_unpublished,
            plugin_type="CategoryPlugin",
            **{"page": category3.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(public_category1.get_blogposts()), [])
            self.assertEqual(list(public_category2.get_blogposts()), [])
            self.assertEqual(list(public_category3.get_blogposts()), [public_blogpost])

        with translation.override("fr"):
            self.assertEqual(list(public_category1.get_blogposts()), [])
            self.assertEqual(list(public_category2.get_blogposts()), [public_blogpost])
            self.assertEqual(list(public_category3.get_blogposts()), [])

        with translation.override("de"):
            self.assertEqual(list(public_category1.get_blogposts()), [public_blogpost])
            self.assertEqual(list(public_category2.get_blogposts()), [])
            self.assertEqual(list(public_category3.get_blogposts()), [])

    def test_models_category_get_blogposts_public_category_page(self):
        """
        When a category is added on a draft blog post, the blog post should not be visible on
        the public category page until the blog post is published.
        """
        category = CategoryFactory(should_publish=True)
        category_page = category.extended_object
        blog_post = BlogPostFactory(page_title="my title", should_publish=True)
        blog_post_page = blog_post.extended_object

        # Add a category to the blog post but don't publish the modification
        placeholder = blog_post_page.placeholders.get(slot="categories")
        add_plugin(placeholder, CategoryPlugin, "en", page=category_page)

        self.assertEqual(list(category.get_blogposts()), [blog_post])
        self.assertEqual(list(category.public_extension.get_blogposts()), [])

        # Now publish the modification and check that the blog post is displayed
        # on the public category page
        blog_post.extended_object.publish("en")
        self.assertEqual(
            list(category.public_extension.get_blogposts()),
            [blog_post.public_extension],
        )

        # If the blog post is unpublished, it should not be displayed on the public
        # page anymore
        blog_post_page.unpublish("en")
        self.assertEqual(list(category.get_blogposts()), [blog_post])
        self.assertEqual(list(category.public_extension.get_blogposts()), [])

    def test_models_category_get_blogposts_several_languages(self):
        """
        The blogposts should not be duplicated if they exist in several languages.
        """
        category = CategoryFactory(should_publish=True)
        BlogPostFactory(
            page_title={"en": "my title", "fr": "mon titre"},
            fill_categories=[category],
            should_publish=True,
        )
        self.assertEqual(BlogPost.objects.count(), 2)
        self.assertEqual(category.get_blogposts().count(), 1)

    # get_organizations

    def test_models_category_get_organizations(self):
        """
        It should be possible to retrieve the list of related organizations on the category
        instance. The number of queries should be minimal.
        """
        category = CategoryFactory(should_publish=True)
        organizations = OrganizationFactory.create_batch(
            2, page_title="my title", fill_categories=[category], should_publish=True
        )
        retrieved_organizations = category.get_organizations()

        with self.assertNumQueries(2):
            self.assertEqual(set(retrieved_organizations), set(organizations))

        with self.assertNumQueries(0):
            for organization in retrieved_organizations:
                self.assertEqual(
                    organization.extended_object.prefetched_titles[0].title, "my title"
                )

    def test_models_category_get_organizations_ordering(self):
        """The related organizations should be sorted by their position in the pages tree."""
        category = CategoryFactory(should_publish=True)
        organization1, organization2, organization3 = OrganizationFactory.create_batch(
            3, fill_categories=[category], should_publish=True
        )
        self.assertEqual(
            list(category.get_organizations()),
            [organization1, organization2, organization3],
        )

        # Move pages in the tree and check that they are returned in the new order
        organization3.extended_object.move_page(
            organization1.extended_object.node, position="left"
        )
        self.assertEqual(
            list(category.get_organizations()),
            [organization3, organization1, organization2],
        )

        organization1.extended_object.move_page(
            organization3.extended_object.node, position="left"
        )
        self.assertEqual(
            list(category.get_organizations()),
            [organization1, organization3, organization2],
        )

    def test_models_category_get_organizations_descendants(self):
        """
        Related organizations should include the organizations linked to the category's
        descendants, unless specifically deactivated by the "include_descendants" argument.
        """
        category_page = create_page(
            "Subjects", "courses/cms/category_detail.html", "en", published=True
        )
        category = CategoryFactory(extended_object=category_page, should_publish=True)
        organizations = OrganizationFactory.create_batch(
            2, fill_categories=[category], should_publish=True
        )

        child_category_page = create_page(
            "Literature",
            "courses/cms/category_detail.html",
            "en",
            parent=category_page,
            published=True,
        )
        child_category = CategoryFactory(
            extended_object=child_category_page, should_publish=True
        )
        organizations_child = OrganizationFactory.create_batch(
            2, fill_categories=[child_category], should_publish=True
        )

        grand_child_category_page = create_page(
            "Literature",
            "courses/cms/category_detail.html",
            "en",
            parent=child_category_page,
            published=True,
        )
        grand_child_category = CategoryFactory(
            extended_object=grand_child_category_page, should_publish=True
        )
        organizations_grand_child = OrganizationFactory.create_batch(
            2, fill_categories=[grand_child_category], should_publish=True
        )

        # Check that each category gets organizations from its descendants
        # ...unless we pass an argument to deactivate it
        self.assertEqual(
            list(category.get_organizations()),
            organizations + organizations_child + organizations_grand_child,
        )
        self.assertEqual(
            list(category.get_organizations(include_descendants=False)), organizations
        )

        self.assertEqual(
            list(child_category.get_organizations()),
            organizations_child + organizations_grand_child,
        )
        self.assertEqual(
            list(child_category.get_organizations(include_descendants=False)),
            organizations_child,
        )

        self.assertEqual(
            list(grand_child_category.get_organizations(include_descendants=False)),
            organizations_grand_child,
        )
        self.assertEqual(
            list(grand_child_category.get_organizations()), organizations_grand_child
        )

    def test_models_category_get_organizations_language_fallback_draft(self):
        """
        Validate that the reverse organizations lookup works as expected with language fallback
        on a draft page.
        """
        category1, category2, category3 = CategoryFactory.create_batch(
            3, should_publish=True
        )
        organization = OrganizationFactory(should_publish=True)
        placeholder = organization.extended_object.placeholders.get(slot="categories")
        cms_languages = {
            "default": {
                "public": True,
                "hide_untranslated": False,
                "redirect_on_fallback": False,
                "fallbacks": ["en", "fr", "de"],
            }
        }

        # Reverse plugin lookups should fallback up to the second priority language
        add_plugin(
            language="de",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category1.extended_object},
        )
        with override_settings(CMS_LANGUAGES=cms_languages):
            with translation.override("en"):
                self.assertEqual(list(category1.get_organizations()), [organization])
                self.assertEqual(list(category2.get_organizations()), [])
                self.assertEqual(list(category3.get_organizations()), [])

            with translation.override("fr"):
                self.assertEqual(list(category1.get_organizations()), [organization])
                self.assertEqual(list(category2.get_organizations()), [])
                self.assertEqual(list(category3.get_organizations()), [])

            with translation.override("de"):
                self.assertEqual(list(category1.get_organizations()), [organization])
                self.assertEqual(list(category2.get_organizations()), [])
                self.assertEqual(list(category3.get_organizations()), [])

        # Reverse plugin lookups should fallback to the first priority language if available
        # and ignore the second priority language unless it is the current language
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category2.extended_object},
        )
        with override_settings(CMS_LANGUAGES=cms_languages):
            with translation.override("en"):
                self.assertEqual(list(category1.get_organizations()), [])
                self.assertEqual(list(category2.get_organizations()), [organization])
                self.assertEqual(list(category3.get_organizations()), [])

            with translation.override("fr"):
                self.assertEqual(list(category1.get_organizations()), [])
                self.assertEqual(list(category2.get_organizations()), [organization])
                self.assertEqual(list(category3.get_organizations()), [])

            with translation.override("de"):
                self.assertEqual(list(category1.get_organizations()), [organization])
                self.assertEqual(list(category2.get_organizations()), [])
                self.assertEqual(list(category3.get_organizations()), [])

        # Reverse plugin lookups should stick to the current language if available and
        # ignore plugins on fallback languages
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category3.extended_object},
        )
        with override_settings(CMS_LANGUAGES=cms_languages):
            with translation.override("en"):
                self.assertEqual(list(category1.get_organizations()), [])
                self.assertEqual(list(category2.get_organizations()), [])
                self.assertEqual(list(category3.get_organizations()), [organization])

            with translation.override("fr"):
                self.assertEqual(list(category1.get_organizations()), [])
                self.assertEqual(list(category2.get_organizations()), [organization])
                self.assertEqual(list(category3.get_organizations()), [])

            with translation.override("de"):
                self.assertEqual(list(category1.get_organizations()), [organization])
                self.assertEqual(list(category2.get_organizations()), [])
                self.assertEqual(list(category3.get_organizations()), [])

    @override_settings(
        LANGUAGES=(("en", "en"), ("fr", "fr"), ("de", "de")),
        CMS_LANGUAGES={
            "default": {
                "public": True,
                "hide_untranslated": False,
                "redirect_on_fallback": False,
                "fallbacks": ["en", "fr", "de"],
            }
        },
    )
    # pylint: disable=too-many-statements
    def test_models_category_get_organizations_language_fallback_published(self):
        """
        Validate that the reverse organizations lookup works as expected with language fallback
        on a published page.
        """
        category1, category2, category3 = CategoryFactory.create_batch(
            3, should_publish=True
        )
        public_category1 = category1.public_extension
        public_category2 = category2.public_extension
        public_category3 = category3.public_extension

        organization, organization_unpublished = OrganizationFactory.create_batch(
            2, page_languages=["en", "fr", "de"], should_publish=True
        )

        public_organization = organization.public_extension

        public_organization_unpublished = organization_unpublished.public_extension
        organization_unpublished.extended_object.unpublish("en")
        organization_unpublished.extended_object.unpublish("fr")
        organization_unpublished.extended_object.unpublish("de")

        placeholder = public_organization.extended_object.placeholders.get(
            slot="categories"
        )
        placeholder_unpublished = (
            public_organization_unpublished.extended_object.placeholders.get(
                slot="categories"
            )
        )
        # Reverse plugin lookups should fallback up to the second priority language
        add_plugin(
            language="de",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category1.extended_object},
        )
        add_plugin(
            language="de",
            placeholder=placeholder_unpublished,
            plugin_type="CategoryPlugin",
            **{"page": category1.extended_object},
        )

        with translation.override("en"):
            self.assertEqual(
                list(public_category1.get_organizations()), [public_organization]
            )
            self.assertEqual(list(public_category2.get_organizations()), [])
            self.assertEqual(list(public_category3.get_organizations()), [])

        with translation.override("fr"):
            self.assertEqual(
                list(public_category1.get_organizations()), [public_organization]
            )
            self.assertEqual(list(public_category2.get_organizations()), [])
            self.assertEqual(list(public_category3.get_organizations()), [])

        with translation.override("de"):
            self.assertEqual(
                list(public_category1.get_organizations()), [public_organization]
            )
            self.assertEqual(list(public_category2.get_organizations()), [])
            self.assertEqual(list(public_category3.get_organizations()), [])

        # Reverse plugin lookups should fallback to the first priority language if available
        # and ignore the second priority language unless it is the current language
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category2.extended_object},
        )
        add_plugin(
            language="fr",
            placeholder=placeholder_unpublished,
            plugin_type="CategoryPlugin",
            **{"page": category2.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(public_category1.get_organizations()), [])
            self.assertEqual(
                list(public_category2.get_organizations()), [public_organization]
            )
            self.assertEqual(list(public_category3.get_organizations()), [])

        with translation.override("fr"):
            self.assertEqual(list(public_category1.get_organizations()), [])
            self.assertEqual(
                list(public_category2.get_organizations()), [public_organization]
            )
            self.assertEqual(list(public_category3.get_organizations()), [])

        with translation.override("de"):
            self.assertEqual(
                list(public_category1.get_organizations()), [public_organization]
            )
            self.assertEqual(list(public_category2.get_organizations()), [])
            self.assertEqual(list(public_category3.get_organizations()), [])

        # Reverse plugin lookups should stick to the current language if available and
        # ignore plugins on fallback languages
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category3.extended_object},
        )
        add_plugin(
            language="en",
            placeholder=placeholder_unpublished,
            plugin_type="CategoryPlugin",
            **{"page": category3.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(public_category1.get_organizations()), [])
            self.assertEqual(list(public_category2.get_organizations()), [])
            self.assertEqual(
                list(public_category3.get_organizations()), [public_organization]
            )

        with translation.override("fr"):
            self.assertEqual(list(public_category1.get_organizations()), [])
            self.assertEqual(
                list(public_category2.get_organizations()), [public_organization]
            )
            self.assertEqual(list(public_category3.get_organizations()), [])

        with translation.override("de"):
            self.assertEqual(
                list(public_category1.get_organizations()), [public_organization]
            )
            self.assertEqual(list(public_category2.get_organizations()), [])
            self.assertEqual(list(public_category3.get_organizations()), [])

    def test_models_category_get_organizations_public_category_page(self):
        """
        When a category is added on a draft organization, the organization should not be visible on
        the public category page until the organization is published.
        """
        category = CategoryFactory(should_publish=True)
        category_page = category.extended_object
        organization = OrganizationFactory(page_title="my title", should_publish=True)
        organization_page = organization.extended_object

        # Add a category to the organization but don't publish the modification
        placeholder = organization_page.placeholders.get(slot="categories")
        add_plugin(placeholder, CategoryPlugin, "en", page=category_page)

        self.assertEqual(list(category.get_organizations()), [organization])
        self.assertEqual(list(category.public_extension.get_organizations()), [])

        # Now publish the modification and check that the organization is displayed
        # on the public category page
        organization.extended_object.publish("en")
        self.assertEqual(
            list(category.public_extension.get_organizations()),
            [organization.public_extension],
        )

        # If the organization is unpublished, it should not be displayed on the public
        # page anymore
        organization_page.unpublish("en")
        self.assertEqual(list(category.get_organizations()), [organization])
        self.assertEqual(list(category.public_extension.get_organizations()), [])

    def test_models_category_get_organizations_several_languages(self):
        """
        The organizations should not be duplicated if they exist in several languages.
        """
        category = CategoryFactory(should_publish=True)
        OrganizationFactory(
            page_title={"en": "my title", "fr": "mon titre"},
            fill_categories=[category],
            should_publish=True,
        )
        self.assertEqual(Organization.objects.count(), 2)
        self.assertEqual(category.get_organizations().count(), 1)

    # get_persons

    def test_models_category_get_persons(self):
        """
        It should be possible to retrieve the list of related persons on the category
        instance. The number of queries should be minimal.
        """
        category = CategoryFactory(should_publish=True)
        persons = PersonFactory.create_batch(
            2, page_title="my title", fill_categories=[category], should_publish=True
        )
        retrieved_persons = category.get_persons()

        with self.assertNumQueries(2):
            self.assertEqual(set(retrieved_persons), set(persons))

        with self.assertNumQueries(0):
            for person in retrieved_persons:
                self.assertEqual(
                    person.extended_object.prefetched_titles[0].title, "my title"
                )

    def test_models_category_get_persons_ordering(self):
        """The related persons should be sorted by their position in the pages tree."""
        category = CategoryFactory(should_publish=True)
        person1, person2, person3 = PersonFactory.create_batch(
            3, fill_categories=[category], should_publish=True
        )
        self.assertEqual(list(category.get_persons()), [person1, person2, person3])

        # Move pages in the tree and check that they are returned in the new order
        person3.extended_object.move_page(person1.extended_object.node, position="left")
        self.assertEqual(list(category.get_persons()), [person3, person1, person2])

        person1.extended_object.move_page(person3.extended_object.node, position="left")
        self.assertEqual(list(category.get_persons()), [person1, person3, person2])

    def test_models_category_get_persons_descendants(self):
        """
        Related persons should include the persons linked to the category's descendants,
        unless specifically deactivated by the "include_descendants" argument.
        """
        category_page = create_page(
            "Subjects", "courses/cms/category_detail.html", "en", published=True
        )
        category = CategoryFactory(extended_object=category_page, should_publish=True)
        persons = PersonFactory.create_batch(
            2, fill_categories=[category], should_publish=True
        )

        child_category_page = create_page(
            "Literature",
            "courses/cms/category_detail.html",
            "en",
            parent=category_page,
            published=True,
        )
        child_category = CategoryFactory(
            extended_object=child_category_page, should_publish=True
        )
        persons_child = PersonFactory.create_batch(
            2, fill_categories=[child_category], should_publish=True
        )

        grand_child_category_page = create_page(
            "Literature",
            "courses/cms/category_detail.html",
            "en",
            parent=child_category_page,
            published=True,
        )
        grand_child_category = CategoryFactory(
            extended_object=grand_child_category_page, should_publish=True
        )
        persons_grand_child = PersonFactory.create_batch(
            2, fill_categories=[grand_child_category], should_publish=True
        )

        # Check that each category gets persons from its descendants
        # ...unless we pass an argument to deactivate it
        self.assertEqual(
            list(category.get_persons()), persons + persons_child + persons_grand_child
        )
        self.assertEqual(list(category.get_persons(include_descendants=False)), persons)

        self.assertEqual(
            list(child_category.get_persons()), persons_child + persons_grand_child
        )
        self.assertEqual(
            list(child_category.get_persons(include_descendants=False)), persons_child
        )

        self.assertEqual(
            list(grand_child_category.get_persons(include_descendants=False)),
            persons_grand_child,
        )
        self.assertEqual(list(grand_child_category.get_persons()), persons_grand_child)

    def test_models_category_get_persons_language_fallback_draft(self):
        """
        Validate that the reverse persons lookup works as expected with language fallback
        on a draft page.
        """
        category1, category2, category3 = CategoryFactory.create_batch(
            3, should_publish=True
        )
        person = PersonFactory(should_publish=True)
        placeholder = person.extended_object.placeholders.get(slot="categories")
        cms_languages = {
            "default": {
                "public": True,
                "hide_untranslated": False,
                "redirect_on_fallback": False,
                "fallbacks": ["en", "fr", "de"],
            }
        }

        # Reverse plugin lookups should fallback up to the second priority language
        add_plugin(
            language="de",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category1.extended_object},
        )
        with override_settings(CMS_LANGUAGES=cms_languages):
            with translation.override("en"):
                self.assertEqual(list(category1.get_persons()), [person])
                self.assertEqual(list(category2.get_persons()), [])
                self.assertEqual(list(category3.get_persons()), [])

            with translation.override("fr"):
                self.assertEqual(list(category1.get_persons()), [person])
                self.assertEqual(list(category2.get_persons()), [])
                self.assertEqual(list(category3.get_persons()), [])

            with translation.override("de"):
                self.assertEqual(list(category1.get_persons()), [person])
                self.assertEqual(list(category2.get_persons()), [])
                self.assertEqual(list(category3.get_persons()), [])

        # Reverse plugin lookups should fallback to the first priority language if available
        # and ignore the second priority language unless it is the current language
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category2.extended_object},
        )
        with override_settings(CMS_LANGUAGES=cms_languages):
            with translation.override("en"):
                self.assertEqual(list(category1.get_persons()), [])
                self.assertEqual(list(category2.get_persons()), [person])
                self.assertEqual(list(category3.get_persons()), [])

            with translation.override("fr"):
                self.assertEqual(list(category1.get_persons()), [])
                self.assertEqual(list(category2.get_persons()), [person])
                self.assertEqual(list(category3.get_persons()), [])

            with translation.override("de"):
                self.assertEqual(list(category1.get_persons()), [person])
                self.assertEqual(list(category2.get_persons()), [])
                self.assertEqual(list(category3.get_persons()), [])

        # Reverse plugin lookups should stick to the current language if available and
        # ignore plugins on fallback languages
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category3.extended_object},
        )
        with override_settings(CMS_LANGUAGES=cms_languages):
            with translation.override("en"):
                self.assertEqual(list(category1.get_persons()), [])
                self.assertEqual(list(category2.get_persons()), [])
                self.assertEqual(list(category3.get_persons()), [person])

            with translation.override("fr"):
                self.assertEqual(list(category1.get_persons()), [])
                self.assertEqual(list(category2.get_persons()), [person])
                self.assertEqual(list(category3.get_persons()), [])

            with translation.override("de"):
                self.assertEqual(list(category1.get_persons()), [person])
                self.assertEqual(list(category2.get_persons()), [])
                self.assertEqual(list(category3.get_persons()), [])

    @override_settings(
        LANGUAGES=(("en", "en"), ("fr", "fr"), ("de", "de")),
        CMS_LANGUAGES={
            "default": {
                "public": True,
                "hide_untranslated": False,
                "redirect_on_fallback": False,
                "fallbacks": ["en", "fr", "de"],
            }
        },
    )
    # pylint: disable=too-many-statements
    def test_models_category_get_persons_language_fallback_published(self):
        """
        Validate that the reverse persons lookup works as expected with language fallback
        on a published page.
        """
        category1, category2, category3 = CategoryFactory.create_batch(
            3, should_publish=True
        )
        public_category1 = category1.public_extension
        public_category2 = category2.public_extension
        public_category3 = category3.public_extension

        person, person_unpublished = PersonFactory.create_batch(
            2, page_languages=["en", "fr", "de"], should_publish=True
        )

        public_person = person.public_extension

        public_person_unpublished = person_unpublished.public_extension
        person_unpublished.extended_object.unpublish("en")
        person_unpublished.extended_object.unpublish("fr")
        person_unpublished.extended_object.unpublish("de")

        placeholder = public_person.extended_object.placeholders.get(slot="categories")
        placeholder_unpublished = (
            public_person_unpublished.extended_object.placeholders.get(
                slot="categories"
            )
        )
        # Reverse plugin lookups should fallback up to the second priority language
        add_plugin(
            language="de",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category1.extended_object},
        )
        add_plugin(
            language="de",
            placeholder=placeholder_unpublished,
            plugin_type="CategoryPlugin",
            **{"page": category1.extended_object},
        )

        with translation.override("en"):
            self.assertEqual(list(public_category1.get_persons()), [public_person])
            self.assertEqual(list(public_category2.get_persons()), [])
            self.assertEqual(list(public_category3.get_persons()), [])

        with translation.override("fr"):
            self.assertEqual(list(public_category1.get_persons()), [public_person])
            self.assertEqual(list(public_category2.get_persons()), [])
            self.assertEqual(list(public_category3.get_persons()), [])

        with translation.override("de"):
            self.assertEqual(list(public_category1.get_persons()), [public_person])
            self.assertEqual(list(public_category2.get_persons()), [])
            self.assertEqual(list(public_category3.get_persons()), [])

        # Reverse plugin lookups should fallback to the first priority language if available
        # and ignore the second priority language unless it is the current language
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category2.extended_object},
        )
        add_plugin(
            language="fr",
            placeholder=placeholder_unpublished,
            plugin_type="CategoryPlugin",
            **{"page": category2.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(public_category1.get_persons()), [])
            self.assertEqual(list(public_category2.get_persons()), [public_person])
            self.assertEqual(list(public_category3.get_persons()), [])

        with translation.override("fr"):
            self.assertEqual(list(public_category1.get_persons()), [])
            self.assertEqual(list(public_category2.get_persons()), [public_person])
            self.assertEqual(list(public_category3.get_persons()), [])

        with translation.override("de"):
            self.assertEqual(list(public_category1.get_persons()), [public_person])
            self.assertEqual(list(public_category2.get_persons()), [])
            self.assertEqual(list(public_category3.get_persons()), [])

        # Reverse plugin lookups should stick to the current language if available and
        # ignore plugins on fallback languages
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category3.extended_object},
        )
        add_plugin(
            language="en",
            placeholder=placeholder_unpublished,
            plugin_type="CategoryPlugin",
            **{"page": category3.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(public_category1.get_persons()), [])
            self.assertEqual(list(public_category2.get_persons()), [])
            self.assertEqual(list(public_category3.get_persons()), [public_person])

        with translation.override("fr"):
            self.assertEqual(list(public_category1.get_persons()), [])
            self.assertEqual(list(public_category2.get_persons()), [public_person])
            self.assertEqual(list(public_category3.get_persons()), [])

        with translation.override("de"):
            self.assertEqual(list(public_category1.get_persons()), [public_person])
            self.assertEqual(list(public_category2.get_persons()), [])
            self.assertEqual(list(public_category3.get_persons()), [])

    def test_models_category_get_persons_public_category_page(self):
        """
        When a category is added on a draft person, the person should not be visible on
        the public category page until the person is published.
        """
        category = CategoryFactory(should_publish=True)
        category_page = category.extended_object
        person = PersonFactory(page_title="my title", should_publish=True)
        person_page = person.extended_object

        # Add a category to the person but don't publish the modification
        placeholder = person_page.placeholders.get(slot="categories")
        add_plugin(placeholder, CategoryPlugin, "en", page=category_page)

        self.assertEqual(list(category.get_persons()), [person])
        self.assertEqual(list(category.public_extension.get_persons()), [])

        # Now publish the modification and check that the person is displayed
        # on the public category page
        person.extended_object.publish("en")
        self.assertEqual(
            list(category.public_extension.get_persons()), [person.public_extension]
        )

        # If the person is unpublished, it should not be displayed on the public
        # page anymore
        person_page.unpublish("en")
        self.assertEqual(list(category.get_persons()), [person])
        self.assertEqual(list(category.public_extension.get_persons()), [])

    def test_models_category_get_persons_several_languages(self):
        """
        The persons should not be duplicated if they exist in several languages.
        """
        category = CategoryFactory(should_publish=True)
        PersonFactory(
            page_title={"en": "my title", "fr": "mon titre"},
            fill_categories=[category],
            should_publish=True,
        )
        self.assertEqual(Person.objects.count(), 2)
        self.assertEqual(category.get_persons().count(), 1)

    def test_models_category_get_children_categories(self):
        """
        It should be possible to retrieve the list of direct children page which
        are Category extensions and not any other type.
        """
        empty_category = CategoryFactory(should_publish=True)

        parent_category = CategoryFactory(should_publish=True)
        child_categories = CategoryFactory.create_batch(
            2, page_parent=parent_category.extended_object, should_publish=True
        )

        with self.assertNumQueries(2):
            self.assertFalse(empty_category.get_children_categories().exists())

        with self.assertNumQueries(2):
            self.assertEqual(
                set(parent_category.get_children_categories()), set(child_categories)
            )
