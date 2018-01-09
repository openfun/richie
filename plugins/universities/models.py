from django.db import models

from cms.models.pluginmodel import CMSPlugin
from cms.models.fields import PlaceholderField
from djangocms_text_ckeditor.fields import HTMLField
from django.forms.models import model_to_dict
from easy_thumbnails.files import get_thumbnailer
from easy_thumbnails.exceptions import InvalidImageFormatError

from django.utils.translation import ugettext_lazy as _

from . import choices as universities_choices

class University(CMSPlugin):
    """
    A university or a school that provides online courses.
    """
    name = models.CharField(_('name'), max_length=255, db_index=True)
    short_name = models.CharField(_('short name'), max_length=255, blank=True, 
        help_text=_('Displayed where space is rare - on side panel for instance.'))
    code = models.CharField(_('code'), max_length=255, unique=True)
    certificate_logo = models.ImageField(_('certificate logo'),
        upload_to='universities', null=True, blank=True,
        help_text=_('Logo to be displayed on the certificate document.'))
    logo = models.ImageField(_('logo'), upload_to='universities')
    detail_page_enabled = models.BooleanField(_('detail page enabled'),
        default=False, db_index=True,
        help_text=_('Enables the university detail page.'))
    is_obsolete = models.BooleanField(_('is obsolete'),
        default=False, db_index=True,
        help_text=_('Obsolete universities do not have their logo displayed on the site.'))
    slug = models.SlugField(_('slug'), max_length=255, unique=True, blank=True,
        help_text=_('Only used if detail page is enabled'))
    banner = models.ImageField(_('banner'), upload_to='universities', null=True,
        blank=True)
    description = HTMLField(blank=False)
    partnership_level = models.CharField(_('partnership level'), max_length=255,
        choices=universities_choices.UNIVERSITY_PARTNERSHIP_LEVEL, blank=True,
        db_index=True)
    score = models.PositiveIntegerField(_('score'), default=0, db_index=True)
    prevent_auto_update = models.BooleanField(
        verbose_name=_('prevent automatic update'), default=False)

    class Meta:
        ordering = ('-score', 'id',)
        verbose_name = _('University')

    def get_absolute_url(self):
        if self.slug:
            return "/universities/" + self.slug
    
    def get_breadcrumb(self):
        return [
            { "name" : "Home", "link" : "/" },
            { "name" : "Universities", "link" : "/universities" },
            { "name" : self.name, "link" : self.slug },
        ]
    
    def get_banner(self):
        options = {'size': (1030, 410), }
        try:
            thumbnail = get_thumbnailer(self.banner).get_thumbnail(options)
            return thumbnail.url
        except InvalidImageFormatError:
            return ''  # we could return a nice grey image

    def get_short_name(self):
        return self.short_name or self.name

    def get_logo_thumbnail(self):
        options = {'size': (180, 100), }
        try:
            thumbnail = get_thumbnailer(self.logo).get_thumbnail(options)
            return thumbnail.url
        except InvalidImageFormatError:
            return '' # we could return a nice grey image

class UniversitiesList(CMSPlugin):
    """
    CMSPlugin to add a list of universities with a limit
    """
    limit = models.IntegerField(blank=False, default=0, null=False)

    def get_universities(self):
        universities = University.objects.all().order_by('-score')
        universities_list = []
        i = 0
        for university in universities:
            if university.detail_page_enabled == True and university.is_obsolete == False:
                universities_list.append(university)
                i+=1
        return universities_list[:self.limit]

class AllUniversitiesList(CMSPlugin):
    """
    CMSPlugin to add a list of all universities with a title and a description
    """
    title = models.CharField(null=False, blank=False, max_length=255, default='')
    description = HTMLField(default='', blank=False)
    universities = University.objects.order_by('-score')

    def get_breadcrumb(self):
        return [
            { "name" : "Home", "link" : "/" },
            { "name" : "Universities", "link" : "/universities" },
        ]
