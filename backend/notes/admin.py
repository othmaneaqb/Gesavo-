from django.contrib import admin
from .models import Note

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'case', 'client', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('title', 'content', 'author__username', 'case__title', 'client__first_name', 'client__last_name')
