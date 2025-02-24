# Generated by Django 4.2.19 on 2025-02-25 09:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("courses", "0037_alter_blogpostpluginmodel_cmsplugin_ptr_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="mainmenuentry",
            name="menu_color",
            field=models.CharField(
                blank=True,
                choices=[("", "None")],
                default="",
                help_text="A color used to display page entry in menu.",
                max_length=50,
                verbose_name="Color in menu",
            ),
        ),
    ]
