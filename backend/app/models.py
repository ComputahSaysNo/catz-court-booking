from django.contrib.auth.models import User, AnonymousUser
from django.db import models


# Create your models here.
class Site(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    logo = models.ImageField(upload_to='site/logo')

    class Meta:
        verbose_name = "site"
        verbose_name_plural = "Site"

    def __str__(self):
        return self.name


class Court(models.Model):
    name = models.CharField(max_length=100)
    opening_time = models.TimeField()
    closing_time = models.TimeField()

    class Meta:
        verbose_name = "court"
        verbose_name_plural = "Courts"

    def __str__(self):
        return self.name


class Booking(models.Model):
    start_time = models.TimeField()
    end_time = models.TimeField()
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    court = models.ForeignKey(Court, on_delete=models.CASCADE)

    class Meta:
        verbose_name = "booking"
        verbose_name_plural = "Bookings"
        ordering = ["date", "start_time"]

    def __str__(self):
        return f'{self.court.name}: {self.date.strftime("%d %b")} {self.start_time.strftime("%H:%M")} - {self.end_time.strftime("%H:%M")} ({self.user.email})'
