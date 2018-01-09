# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import djangocms_text_ckeditor.fields


class Migration(migrations.Migration):

    dependencies = [
        ('cms', '0016_auto_20160608_1535'),
    ]

    operations = [
        migrations.CreateModel(
            name='AllUniversitiesList',
            fields=[
                ('cmsplugin_ptr', models.OneToOneField(parent_link=True, related_name='universities_alluniversitieslist', auto_created=True, primary_key=True, serialize=False, to='cms.CMSPlugin')),
                ('title', models.CharField(default=b'', max_length=255)),
                ('description', djangocms_text_ckeditor.fields.HTMLField(default=b'')),
            ],
            options={
                'abstract': False,
            },
            bases=('cms.cmsplugin',),
        ),
        migrations.CreateModel(
            name='UniversitiesList',
            fields=[
                ('cmsplugin_ptr', models.OneToOneField(parent_link=True, related_name='universities_universitieslist', auto_created=True, primary_key=True, serialize=False, to='cms.CMSPlugin')),
                ('limit', models.IntegerField(default=0)),
            ],
            options={
                'abstract': False,
            },
            bases=('cms.cmsplugin',),
        ),
        migrations.CreateModel(
            name='University',
            fields=[
                ('cmsplugin_ptr', models.OneToOneField(parent_link=True, related_name='universities_university', auto_created=True, primary_key=True, serialize=False, to='cms.CMSPlugin')),
                ('name', models.CharField(max_length=255, verbose_name='name', db_index=True)),
                ('short_name', models.CharField(help_text='Displayed where space is rare - on side panel for instance.', max_length=255, verbose_name='short name', blank=True)),
                ('code', models.CharField(unique=True, max_length=255, verbose_name='code')),
                ('certificate_logo', models.ImageField(help_text='Logo to be displayed on the certificate document.', upload_to=b'universities', null=True, verbose_name='certificate logo', blank=True)),
                ('logo', models.ImageField(upload_to=b'universities', verbose_name='logo')),
                ('detail_page_enabled', models.BooleanField(default=False, help_text='Enables the university detail page.', db_index=True, verbose_name='detail page enabled')),
                ('is_obsolete', models.BooleanField(default=False, help_text='Obsolete universities do not have their logo displayed on the site.', db_index=True, verbose_name='is obsolete')),
                ('slug', models.SlugField(max_length=255, blank=True, help_text='Only used if detail page is enabled', unique=True, verbose_name='slug')),
                ('banner', models.ImageField(upload_to=b'universities', null=True, verbose_name='banner', blank=True)),
                ('description', djangocms_text_ckeditor.fields.HTMLField()),
                ('partnership_level', models.CharField(blank=True, max_length=255, verbose_name='partnership level', db_index=True, choices=[(b'simple-partner', 'Partner'), (b'academic-partner', 'Academic Partner'), (b'level-1', 'Level 1'), (b'level-2', 'Level 2'), (b'level-3', 'Level 3')])),
                ('score', models.PositiveIntegerField(default=0, verbose_name='score', db_index=True)),
                ('prevent_auto_update', models.BooleanField(default=False, verbose_name='prevent automatic update')),
            ],
            options={
                'ordering': ('-score', 'id'),
                'verbose_name': 'University',
            },
            bases=('cms.cmsplugin',),
        ),
    ]
