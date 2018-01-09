# -*- coding: utf-8 -*-

from django.utils.translation import ugettext_lazy as _

"""
Global variables to define partner level
"""

PARTNER_LEVEL_SIMPLE = 'simple-partner'
PARTNER_LEVEL_ACADEMIC = 'academic-partner'
PARTNER_LEVEL_1 = 'level-1'
PARTNER_LEVEL_2 = 'level-2'
PARTNER_LEVEL_3 = 'level-3'

UNIVERSITY_PARTNERSHIP_LEVEL = (
    (PARTNER_LEVEL_SIMPLE, _('Partner')),
    (PARTNER_LEVEL_ACADEMIC, _('Academic Partner')),
    (PARTNER_LEVEL_1, _('Level 1')),
    (PARTNER_LEVEL_2, _('Level 2')),
    (PARTNER_LEVEL_3, _('Level 3')),
)
