from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Cabinet, CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'cabinet', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        ('Role Configuration', {'fields': ('role', 'cabinet')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Role Configuration', {'fields': ('role', 'cabinet')}),
    )

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Cabinet)
