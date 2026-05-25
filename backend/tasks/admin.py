from django.contrib import admin
from .models import Task

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'case', 'assigned_to', 'status', 'due_date')
    list_filter = ('status', 'due_date')
    search_fields = ('title', 'description', 'case__title', 'assigned_to__username')
