from graphene_django import DjangoObjectType
import graphene
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


class SessionInfoType(graphene.ObjectType):
    is_authenticated = graphene.Boolean()
    user = graphene.Field(UserType)
