"""
Sitemap generators for contents
"""
from cms.sitemaps import CMSSitemap


class CourseRunFreeSitemap(CMSSitemap):
    """
    A CMS pages sitemap which is free from Course run items.
    """

    def items(self):
        titles = super().items()

        # Exclude all page which have a non null course run attribute
        return titles.filter(page__courserun__isnull=True)
