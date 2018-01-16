from django.core.urlresolvers import reverse
from django.db import models

from cms.models.pluginmodel import CMSPlugin
from cms.models.fields import PlaceholderField
from djangocms_text_ckeditor.fields import HTMLField
from django.forms.models import model_to_dict
from easy_thumbnails.files import get_thumbnailer
from easy_thumbnails.exceptions import InvalidImageFormatError

from django.utils.translation import ugettext_lazy as _

class Organization(CMSPlugin):
    """
    A Organization or a school that provides online courses.
    """

    PARTNER_LEVEL_SIMPLE = 'simple_partner'
    PARTNER_LEVEL_ACADEMIC = 'academic_partner'
    PARTNER_LEVEL_1 = 'level_1'
    PARTNER_LEVEL_2 = 'level_2'
    PARTNER_LEVEL_3 = 'level_3'

    PARTNER_LEVEL_CHOICES = (
        (PARTNER_LEVEL_SIMPLE, _('Partner')),
        (PARTNER_LEVEL_ACADEMIC, _('Academic Partner')),
        (PARTNER_LEVEL_1, _('Level 1')),
        (PARTNER_LEVEL_2, _('Level 2')),
        (PARTNER_LEVEL_3, _('Level 3')),
    )

    name = models.CharField(_('name'), max_length=255, db_index=True)
    short_name = models.CharField(_('short name'), max_length=255, blank=True, 
        help_text=_('Displayed where space is rare - on side panel for instance.'))
    code = models.CharField(_('code'), max_length=255, unique=True)
    certificate_logo = models.ImageField(_('certificate logo'),
        upload_to='Organization', null=True, blank=True,
        help_text=_('Logo to be displayed on the certificate document.'))
    logo = models.ImageField(_('logo'), upload_to='Organization')
    is_detail_page_enabled = models.BooleanField(_('detail page enabled'),
        default=False, db_index=True,
        help_text=_('Enables the university detail page.'))
    is_obsolete = models.BooleanField(_('is obsolete'),
        default=False, db_index=True,
        help_text=_('Obsolete Organization do not have their logo displayed on the site.'))
    slug = models.SlugField(_('slug'), max_length=255, unique=True,
        help_text=_('Only used if detail page is enabled'))
    banner = models.ImageField(_('banner'), upload_to='Organization', null=True,
        blank=True)
    description = HTMLField(blank=False)
    partnership_level = models.CharField(_('partnership level'), max_length=255,
        choices=PARTNER_LEVEL_CHOICES, blank=True,
        db_index=True)
    score = models.PositiveIntegerField(_('score'), default=0, db_index=True)

    class Meta:
        ordering = ('-score', 'id',)
        verbose_name = _('Organization')

    def get_absolute_url(self):
        if self.slug:
            try:
                return reverse('organization_detail', kwargs={'slug':self.slug})
            except:
                return reverse('{0}:organization_detail'.format('Organization App'), kwargs={'slug':self.slug})
    
    def get_banner_thumbnail(self):
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

class OrganizationList(CMSPlugin):
    """
    CMSPlugin to add a list of Organization with a limit
    """
    limit = models.IntegerField(blank=False, default=0, null=False)

    def get_organizations_limit(self):
        return Organization.objects.filter(is_detail_page_enabled=True, is_obsolete=False).order_by('-score')[:self.limit]

    def get_organizations(self):
        return Organization.objects.filter(is_detail_page_enabled=True, is_obsolete=False).order_by('-score')

    def get_breadcrumb(self):
        try:
            return reverse('organization_list')
        except:
            return reverse('{0}:organization_list'.format('Organization App'))
