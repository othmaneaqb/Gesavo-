from django.db import migrations, models
import django.db.models.deletion


def assign_existing_users(apps, schema_editor):
    Cabinet = apps.get_model('users', 'Cabinet')
    CustomUser = apps.get_model('users', 'CustomUser')
    cabinet, _ = Cabinet.objects.get_or_create(
        slug='cabinet-principal',
        defaults={'name': 'Cabinet principal'},
    )
    CustomUser.objects.filter(cabinet__isnull=True).update(cabinet=cabinet)


def unassign_users(apps, schema_editor):
    CustomUser = apps.get_model('users', 'CustomUser')
    CustomUser.objects.update(cabinet=None)


class Migration(migrations.Migration):
    dependencies = [('users', '0002_add_admin_role')]

    operations = [
        migrations.CreateModel(
            name='Cabinet',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('slug', models.SlugField(max_length=220, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'ordering': ('name',)},
        ),
        migrations.AddField(
            model_name='customuser',
            name='cabinet',
            field=models.ForeignKey(
                blank=True,
                help_text='Required for every non-superuser account.',
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='members',
                to='users.cabinet',
            ),
        ),
        migrations.RunPython(assign_existing_users, unassign_users),
        migrations.AddConstraint(
            model_name='customuser',
            constraint=models.CheckConstraint(
                condition=models.Q(('cabinet__isnull', False), ('is_superuser', True), _connector='OR'),
                name='users_user_cabinet_or_superuser',
            ),
        ),
    ]
