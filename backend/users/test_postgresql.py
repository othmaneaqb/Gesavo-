from django.conf import settings
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TestCase


class PostgreSQLContractTests(TestCase):
    """Fail loudly if the backend test gate is accidentally run on SQLite."""

    def test_test_database_is_postgresql_17(self):
        self.assertEqual(connection.vendor, 'postgresql')
        self.assertEqual(
            settings.DATABASES['default']['ENGINE'],
            'django.db.backends.postgresql',
        )
        with connection.cursor() as cursor:
            cursor.execute('SHOW server_version_num')
            version_number = int(cursor.fetchone()[0])
        self.assertGreaterEqual(version_number, 170000)

    def test_every_leaf_migration_is_applied(self):
        executor = MigrationExecutor(connection)
        plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
        self.assertEqual(plan, [])

    def test_security_constraints_and_audit_indexes_exist_in_postgresql(self):
        expected = {
            'clients_client': {
                'clients_unique_email_per_cabinet': 'unique',
            },
            'finance_transaction': {
                'finance_transaction_amount_positive': 'check',
                'finance_transaction_status_matches_type': 'check',
            },
            'documents_documentauditlog': {
                'documents_audit_document_idx': 'index',
                'documents_audit_created_idx': 'index',
            },
        }

        with connection.cursor() as cursor:
            for table, required_constraints in expected.items():
                constraints = connection.introspection.get_constraints(cursor, table)
                for name, kind in required_constraints.items():
                    self.assertIn(name, constraints, f'{name} is missing from {table}')
                    self.assertTrue(
                        constraints[name][kind],
                        f'{name} on {table} is not a PostgreSQL {kind}',
                    )

    def test_audit_snapshots_use_native_jsonb_columns(self):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_schema = current_schema()
                  AND table_name = 'documents_documentauditlog'
                  AND column_name IN ('before', 'after')
                ORDER BY column_name
                """
            )
            column_types = dict(cursor.fetchall())

        self.assertEqual(column_types, {'after': 'jsonb', 'before': 'jsonb'})
