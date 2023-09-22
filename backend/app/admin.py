from django.contrib import admin
from .models import *


# Register your models here.


class BookingAdmin(admin.ModelAdmin):
    list_display = ('court', 'user', 'date', 'start_time', 'end_time')

admin.site.register(Site)
admin.site.register(Court)
admin.site.register(Booking, BookingAdmin)
