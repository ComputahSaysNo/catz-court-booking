from graphene_django import DjangoObjectType
from app import models


class SiteType(DjangoObjectType):
    class Meta:
        model = models.Site


class UserType(DjangoObjectType):
    class Meta:
        model = models.User


class CourtType(DjangoObjectType):
    class Meta:
        model = models.Court


class BookingType(DjangoObjectType):
    class Meta:
        model = models.Booking
