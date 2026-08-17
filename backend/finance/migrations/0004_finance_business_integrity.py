from collections import defaultdict
import decimal

from django.conf import settings
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


def backfill_finance_integrity(apps, schema_editor):
    Invoice = apps.get_model('finance', 'Invoice')
    InvoiceSequence = apps.get_model('finance', 'InvoiceSequence')
    Payment = apps.get_model('finance', 'Payment')
    Transaction = apps.get_model('finance', 'Transaction')
    alias = schema_editor.connection.alias

    invalid_counts = {
        'invoices with non-positive amounts': Invoice.objects.using(alias).filter(amount__lte=0).count(),
        'payments with non-positive amounts': Payment.objects.using(alias).filter(amount__lte=0).count(),
        'transactions with non-positive amounts': Transaction.objects.using(alias).filter(amount__lte=0).count(),
    }
    invalid_counts = {label: count for label, count in invalid_counts.items() if count}
    if invalid_counts:
        details = ', '.join(f'{label}: {count}' for label, count in invalid_counts.items())
        raise RuntimeError(
            f'Finance integrity migration stopped; remediate historical data first ({details}).'
        )

    for invoice in Invoice.objects.using(alias).select_related('client', 'case').all():
        if invoice.case_id and invoice.case.client_id != invoice.client_id:
            raise RuntimeError(
                f'Invoice #{invoice.pk} links a case and client that do not match.'
            )
        invoice.created_by_id = (
            invoice.case.created_by_id if invoice.case_id else invoice.client.created_by_id
        ) or invoice.client.created_by_id
        invoice.save(update_fields=['created_by'], using=alias)

    for payment in Payment.objects.using(alias).select_related('invoice').all():
        payment.created_by_id = payment.invoice.created_by_id
        payment.save(update_fields=['created_by'], using=alias)

    for item in Transaction.objects.using(alias).select_related('client', 'case').all():
        if item.case_id and item.case.client_id != item.client_id:
            raise RuntimeError(
                f'Transaction #{item.pk} links a case and client that do not match.'
            )
        item.created_by_id = (
            item.case.created_by_id if item.case_id else item.client.created_by_id
        ) or item.client.created_by_id
        if item.type == 'invoice':
            item.status = item.status if item.status in ('outstanding', 'paid') else 'outstanding'
        elif item.type == 'payment':
            item.status = 'paid'
        else:
            item.status = None
        item.save(update_fields=['created_by', 'status'], using=alias)

    records = []
    for invoice in Invoice.objects.using(alias).select_related('client__cabinet').all():
        records.append(
            (
                invoice.client.cabinet_id,
                invoice.client.cabinet.slug,
                invoice.issue_date.year,
                invoice.issue_date,
                0,
                invoice.pk,
                'invoice',
            )
        )
    for item in Transaction.objects.using(alias).filter(type='invoice').select_related(
        'client__cabinet'
    ):
        records.append(
            (
                item.client.cabinet_id,
                item.client.cabinet.slug,
                item.date.year,
                item.date,
                1,
                item.pk,
                'transaction',
            )
        )

    counters = defaultdict(int)
    for cabinet_id, slug, year, record_date, kind_order, pk, kind in sorted(records):
        key = (cabinet_id, year)
        counters[key] += 1
        number = f'{slug.upper()}-{year}-{counters[key]:05d}'
        if kind == 'invoice':
            Invoice.objects.using(alias).filter(pk=pk).update(number=number)
        else:
            Transaction.objects.using(alias).filter(pk=pk).update(invoice_number=number)

    for (cabinet_id, year), last_value in counters.items():
        InvoiceSequence.objects.using(alias).update_or_create(
            cabinet_id=cabinet_id,
            year=year,
            defaults={'next_value': last_value + 1},
        )


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('users', '0003_cabinet_and_membership'),
        ('cases', '0003_case_owner'),
        ('clients', '0003_client_cabinet_and_owner'),
        ('finance', '0003_transaction'),
    ]

    operations = [
        migrations.CreateModel(
            name='InvoiceSequence',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year', models.PositiveSmallIntegerField()),
                ('next_value', models.PositiveBigIntegerField(default=1)),
                ('cabinet', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='invoice_sequences', to='users.cabinet')),
            ],
        ),
        migrations.AddField(
            model_name='invoice',
            name='number',
            field=models.CharField(blank=True, max_length=80, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='invoice',
            name='created_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_invoices', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='invoice',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='invoice',
            name='updated_at',
            field=models.DateTimeField(auto_now=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='payment',
            name='created_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_payments', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='payment',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='payment',
            name='updated_at',
            field=models.DateTimeField(auto_now=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='transaction',
            name='invoice_number',
            field=models.CharField(blank=True, editable=False, max_length=80, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='transaction',
            name='created_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_finance_transactions', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='transaction',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='transaction',
            name='updated_at',
            field=models.DateTimeField(auto_now=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddConstraint(
            model_name='invoicesequence',
            constraint=models.UniqueConstraint(fields=('cabinet', 'year'), name='finance_unique_invoice_sequence'),
        ),
        migrations.RunPython(
            backfill_finance_integrity,
            migrations.RunPython.noop,
            atomic=True,
        ),
        migrations.AlterField(
            model_name='invoice',
            name='number',
            field=models.CharField(editable=False, max_length=80, unique=True),
        ),
        migrations.AlterField(
            model_name='invoice',
            name='amount',
            field=models.DecimalField(decimal_places=2, max_digits=10, validators=[django.core.validators.MinValueValidator(decimal.Decimal('0.01'), message='Amount must be greater than zero.')]),
        ),
        migrations.AlterField(
            model_name='payment',
            name='amount',
            field=models.DecimalField(decimal_places=2, max_digits=10, validators=[django.core.validators.MinValueValidator(decimal.Decimal('0.01'), message='Amount must be greater than zero.')]),
        ),
        migrations.AlterField(
            model_name='transaction',
            name='amount',
            field=models.DecimalField(decimal_places=2, max_digits=10, validators=[django.core.validators.MinValueValidator(decimal.Decimal('0.01'), message='Amount must be greater than zero.')]),
        ),
        migrations.AddConstraint(
            model_name='invoice',
            constraint=models.CheckConstraint(condition=models.Q(('amount__gt', 0)), name='finance_invoice_amount_positive'),
        ),
        migrations.AddConstraint(
            model_name='payment',
            constraint=models.CheckConstraint(condition=models.Q(('amount__gt', 0)), name='finance_payment_amount_positive'),
        ),
        migrations.AddConstraint(
            model_name='transaction',
            constraint=models.CheckConstraint(condition=models.Q(('amount__gt', 0)), name='finance_transaction_amount_positive'),
        ),
        migrations.AddConstraint(
            model_name='transaction',
            constraint=models.CheckConstraint(
                condition=(
                    models.Q(type='invoice', status__in=('outstanding', 'paid'))
                    | models.Q(type='payment', status='paid')
                    | models.Q(type='expense', status__isnull=True)
                ),
                name='finance_transaction_status_matches_type',
            ),
        ),
        migrations.CreateModel(
            name='FinanceAuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('resource_type', models.CharField(choices=[('INVOICE', 'Invoice'), ('PAYMENT', 'Payment'), ('TRANSACTION', 'Transaction')], max_length=20)),
                ('resource_id', models.PositiveBigIntegerField()),
                ('action', models.CharField(choices=[('CREATE', 'Create'), ('UPDATE', 'Update'), ('DELETE', 'Delete')], max_length=10)),
                ('before', models.JSONField(blank=True, default=dict)),
                ('after', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('actor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='finance_audit_actions', to=settings.AUTH_USER_MODEL)),
                ('cabinet', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='finance_audit_logs', to='users.cabinet')),
                ('case', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='finance_audit_logs', to='cases.case')),
                ('client', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='finance_audit_logs', to='clients.client')),
            ],
            options={
                'ordering': ('-created_at', '-id'),
                'indexes': [
                    models.Index(fields=['cabinet', 'resource_type', 'resource_id'], name='finance_audit_resource_idx'),
                    models.Index(fields=['cabinet', 'created_at'], name='finance_audit_created_idx'),
                ],
            },
        ),
    ]
