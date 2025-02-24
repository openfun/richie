# Generated by Django 4.2.19 on 2025-02-25 09:38

import django.db.models.deletion
from django.db import migrations, models

import richie.apps.core.fields.multiselect


class Migration(migrations.Migration):

    dependencies = [
        ("cms", "0022_auto_20180620_1551"),
        ("courses", "0036_courserun_certificate_offer_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="blogpostpluginmodel",
            name="cmsplugin_ptr",
            field=models.OneToOneField(
                auto_created=True,
                on_delete=django.db.models.deletion.CASCADE,
                parent_link=True,
                primary_key=True,
                related_name="%(app_label)s_%(class)s",
                serialize=False,
                to="cms.cmsplugin",
            ),
        ),
        migrations.AlterField(
            model_name="categorypluginmodel",
            name="cmsplugin_ptr",
            field=models.OneToOneField(
                auto_created=True,
                on_delete=django.db.models.deletion.CASCADE,
                parent_link=True,
                primary_key=True,
                related_name="%(app_label)s_%(class)s",
                serialize=False,
                to="cms.cmsplugin",
            ),
        ),
        migrations.AlterField(
            model_name="coursepluginmodel",
            name="cmsplugin_ptr",
            field=models.OneToOneField(
                auto_created=True,
                on_delete=django.db.models.deletion.CASCADE,
                parent_link=True,
                primary_key=True,
                related_name="%(app_label)s_%(class)s",
                serialize=False,
                to="cms.cmsplugin",
            ),
        ),
        migrations.AlterField(
            model_name="courserun",
            name="languages",
            field=richie.apps.core.fields.multiselect.MultiSelectField(
                choices=[
                    ("af", "Afrikaans"),
                    ("ar", "Arabic"),
                    ("ar-dz", "Algerian Arabic"),
                    ("ast", "Asturian"),
                    ("az", "Azerbaijani"),
                    ("bg", "Bulgarian"),
                    ("be", "Belarusian"),
                    ("bn", "Bengali"),
                    ("br", "Breton"),
                    ("bs", "Bosnian"),
                    ("ca", "Catalan"),
                    ("ckb", "Central Kurdish (Sorani)"),
                    ("cs", "Czech"),
                    ("cy", "Welsh"),
                    ("da", "Danish"),
                    ("de", "German"),
                    ("dsb", "Lower Sorbian"),
                    ("el", "Greek"),
                    ("en", "English"),
                    ("en-au", "Australian English"),
                    ("en-gb", "British English"),
                    ("eo", "Esperanto"),
                    ("es", "Spanish"),
                    ("es-ar", "Argentinian Spanish"),
                    ("es-co", "Colombian Spanish"),
                    ("es-mx", "Mexican Spanish"),
                    ("es-ni", "Nicaraguan Spanish"),
                    ("es-ve", "Venezuelan Spanish"),
                    ("et", "Estonian"),
                    ("eu", "Basque"),
                    ("fa", "Persian"),
                    ("fi", "Finnish"),
                    ("fr", "French"),
                    ("fy", "Frisian"),
                    ("ga", "Irish"),
                    ("gd", "Scottish Gaelic"),
                    ("gl", "Galician"),
                    ("he", "Hebrew"),
                    ("hi", "Hindi"),
                    ("hr", "Croatian"),
                    ("hsb", "Upper Sorbian"),
                    ("hu", "Hungarian"),
                    ("hy", "Armenian"),
                    ("ia", "Interlingua"),
                    ("id", "Indonesian"),
                    ("ig", "Igbo"),
                    ("io", "Ido"),
                    ("is", "Icelandic"),
                    ("it", "Italian"),
                    ("ja", "Japanese"),
                    ("ka", "Georgian"),
                    ("kab", "Kabyle"),
                    ("kk", "Kazakh"),
                    ("km", "Khmer"),
                    ("kn", "Kannada"),
                    ("ko", "Korean"),
                    ("ky", "Kyrgyz"),
                    ("lb", "Luxembourgish"),
                    ("lt", "Lithuanian"),
                    ("lv", "Latvian"),
                    ("mk", "Macedonian"),
                    ("ml", "Malayalam"),
                    ("mn", "Mongolian"),
                    ("mr", "Marathi"),
                    ("ms", "Malay"),
                    ("my", "Burmese"),
                    ("nb", "Norwegian Bokmål"),
                    ("ne", "Nepali"),
                    ("nl", "Dutch"),
                    ("nn", "Norwegian Nynorsk"),
                    ("os", "Ossetic"),
                    ("pa", "Punjabi"),
                    ("pl", "Polish"),
                    ("pt", "Portuguese"),
                    ("pt-br", "Brazilian Portuguese"),
                    ("ro", "Romanian"),
                    ("ru", "Russian"),
                    ("sk", "Slovak"),
                    ("sl", "Slovenian"),
                    ("sq", "Albanian"),
                    ("sr", "Serbian"),
                    ("sr-latn", "Serbian Latin"),
                    ("sv", "Swedish"),
                    ("sw", "Swahili"),
                    ("ta", "Tamil"),
                    ("te", "Telugu"),
                    ("tg", "Tajik"),
                    ("th", "Thai"),
                    ("tk", "Turkmen"),
                    ("tr", "Turkish"),
                    ("tt", "Tatar"),
                    ("udm", "Udmurt"),
                    ("uk", "Ukrainian"),
                    ("ur", "Urdu"),
                    ("uz", "Uzbek"),
                    ("vi", "Vietnamese"),
                    ("zh-hans", "Simplified Chinese"),
                    ("zh-hant", "Traditional Chinese"),
                ],
                help_text="The list of languages in which the course content is available.",
                max_choices=50,
                max_length=255,
            ),
        ),
        migrations.AlterField(
            model_name="licencepluginmodel",
            name="cmsplugin_ptr",
            field=models.OneToOneField(
                auto_created=True,
                on_delete=django.db.models.deletion.CASCADE,
                parent_link=True,
                primary_key=True,
                related_name="%(app_label)s_%(class)s",
                serialize=False,
                to="cms.cmsplugin",
            ),
        ),
        migrations.AlterField(
            model_name="organizationpluginmodel",
            name="cmsplugin_ptr",
            field=models.OneToOneField(
                auto_created=True,
                on_delete=django.db.models.deletion.CASCADE,
                parent_link=True,
                primary_key=True,
                related_name="%(app_label)s_%(class)s",
                serialize=False,
                to="cms.cmsplugin",
            ),
        ),
        migrations.AlterField(
            model_name="organizationsbycategorypluginmodel",
            name="cmsplugin_ptr",
            field=models.OneToOneField(
                auto_created=True,
                on_delete=django.db.models.deletion.CASCADE,
                parent_link=True,
                primary_key=True,
                related_name="%(app_label)s_%(class)s",
                serialize=False,
                to="cms.cmsplugin",
            ),
        ),
        migrations.AlterField(
            model_name="personpluginmodel",
            name="cmsplugin_ptr",
            field=models.OneToOneField(
                auto_created=True,
                on_delete=django.db.models.deletion.CASCADE,
                parent_link=True,
                primary_key=True,
                related_name="%(app_label)s_%(class)s",
                serialize=False,
                to="cms.cmsplugin",
            ),
        ),
        migrations.AlterField(
            model_name="programpluginmodel",
            name="cmsplugin_ptr",
            field=models.OneToOneField(
                auto_created=True,
                on_delete=django.db.models.deletion.CASCADE,
                parent_link=True,
                primary_key=True,
                related_name="%(app_label)s_%(class)s",
                serialize=False,
                to="cms.cmsplugin",
            ),
        ),
    ]
