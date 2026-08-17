from django.contrib import admin
from .models import Case

@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = ('title', 'client', 'created_by', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('title', 'client__first_name', 'client__last_name')
    filter_horizontal = ('assigned_lawyers',)
