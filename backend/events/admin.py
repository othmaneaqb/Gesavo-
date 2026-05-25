from django.contrib import admin
from .models import Event

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'case', 'start_time', 'end_time')
    list_filter = ('start_time', 'end_time')
    search_fields = ('title', 'description', 'case__title')
    filter_horizontal = ('attendees',)
