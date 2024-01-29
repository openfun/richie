"""Update Elasticsearch indices each time a page is modified."""

from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from django.dispatch import receiver

from cms import operations
from cms.models import Title
from cms.signals import post_obj_operation

from richie.apps.courses.models import Category, Course, Organization, Person
from richie.apps.search.index_manager import richie_bulk
from richie.apps.search.indexers import ES_INDICES
from richie.apps.search.indexers.categories import CategoriesIndexer


def apply_es_action_to_course(instance, action, _language):
    """
    Update Elasticsearch indices when a course is modified:
    - update the course document in the Elasticsearch courses index.

    Returns None if the page was related to a course and the Elasticsearch update is done.
    Raises ObjectDoesNotExist if the page instance is not related to a course.
    """
    course = Course.objects.get(draft_extension__extended_object=instance)
    if not course.is_snapshot:
        richie_bulk(
            [ES_INDICES.courses.get_es_document_for_course(course, action=action)]
        )


def apply_es_action_to_organization(instance, action, language):
    """
    Update Elasticsearch indices when an organization is modified:
    - update the organization document in the Elasticsearch organizations index for the
      organization and its direct parent (because the parent ID may change from Parent to Leaf),
    - update the course documents in the Elasticsearch courses index for all courses linked to
      this organization.

    Returns None if the page was related to an organization and the Elasticsearch update is done.
    Raises ObjectDoesNotExist if the page instance is not related to an organization.
    """
    organization = Organization.objects.get(draft_extension__extended_object=instance)
    actions = [
        ES_INDICES.courses.get_es_document_for_course(course)
        for course in organization.get_courses(language)
        if not course.is_snapshot
    ]
    actions.append(
        ES_INDICES.organizations.get_es_document_for_organization(
            organization, action=action
        )
    )

    # Update the organization's parent only if it exists
    try:
        parent = organization.extended_object.get_parent_page().organization
    except AttributeError:
        pass
    else:
        actions.append(
            ES_INDICES.organizations.get_es_document_for_organization(parent)
        )

    richie_bulk(actions)


def apply_es_action_to_person(instance, action, language):
    """
    Update Elasticsearch indices when a person is modified:
    - update the person document in the Elasticsearch persons index for the
      person,
    - update the course documents in the Elasticsearch courses index for all courses linked to
      this person.

    Returns None if the page was related to a person and the Elasticsearch update is done.
    Raises ObjectDoesNotExist if the page instance is not related to a person.
    """
    person = Person.objects.get(draft_extension__extended_object=instance)
    actions = [
        ES_INDICES.courses.get_es_document_for_course(course)
        for course in person.get_courses(language)
        if not course.is_snapshot
    ]
    actions.append(ES_INDICES.persons.get_es_document_for_person(person, action=action))

    richie_bulk(actions)


def apply_es_action_to_category(instance, action, language):
    """
    Update Elasticsearch indices when a category is modified:
    - update the category document in the Elasticsearch categories index for the category
      and its direct parent (because the parent ID may change from Parent to Leaf),
    - update the course documents in the Elasticsearch courses index for all courses linked to
      this category.

    Returns None if the page was related to a category and the Elasticsearch update is done.
    Raises ObjectDoesNotExist if the page instance is not related to a category.
    """
    category = Category.objects.get(draft_extension__extended_object=instance)
    actions = [
        ES_INDICES.courses.get_es_document_for_course(course)
        for course in category.get_courses(language)
        if not course.is_snapshot
    ]
    actions.append(
        ES_INDICES.categories.get_es_document_for_category(category, action=action)
    )

    # Update the category's parent only if it exists
    try:
        parent = category.extended_object.get_parent_page().category
    except AttributeError:
        pass
    else:
        actions.append(ES_INDICES.categories.get_es_document_for_category(parent))

    richie_bulk(actions)


def apply_es_action_to_page(page, action, language):
    """
    Try updating each type of page extension one-by-one until one works (because we don't know
    to which type of page extension this page is related).
    """
    for method in [
        apply_es_action_to_course,
        apply_es_action_to_category,
        apply_es_action_to_organization,
        apply_es_action_to_person,
    ]:
        try:
            # The method should raise an ObjectDoesNotExist exception if the page extension
            # linked to this page is of another type.
            method(page, action, language)
        except ObjectDoesNotExist:
            continue
        else:
            return


# pylint: disable=unused-argument
def on_page_published(sender, instance, language, **kwargs):
    """
    Trigger update of the Elasticsearch indices impacted by the modification of the instance
    only once the database transaction is successful.
    """
    if getattr(settings, "RICHIE_KEEP_SEARCH_UPDATED", True):
        transaction.on_commit(
            lambda: apply_es_action_to_page(instance, "index", language)
        )


# pylint: disable=unused-argument
def on_page_unpublished(sender, instance, language, **kwargs):
    """
    Trigger update of the Elasticsearch indices impacted by the modification of the instance
    only once the database transaction is successful.
    """
    if getattr(settings, "RICHIE_KEEP_SEARCH_UPDATED", True):
        # Only unlist pages that are unpublished from all languages otherwise,
        # reindex it to remove the unpublished language
        action = (
            "index"
            if Title.objects.filter(page=instance, published=True).exists()
            else "delete"
        )
        transaction.on_commit(
            lambda: apply_es_action_to_page(instance, action, language)
        )


# pylint: disable=unused-argument
@receiver(post_obj_operation)
def on_page_moved(sender, **kwargs):
    """
    When a page is moved, we may need to re-index all pages linked to objects of
    the same kind. This applies to all category pages as they have the
    *path* of the page in the ES index.
    """
    if getattr(settings, "RICHIE_KEEP_SEARCH_UPDATED", True):
        operation_type = kwargs["operation"]
        if operation_type == operations.MOVE_PAGE:
            page = kwargs["obj"]
            if hasattr(page, "category"):
                richie_bulk(CategoriesIndexer.get_es_documents())
