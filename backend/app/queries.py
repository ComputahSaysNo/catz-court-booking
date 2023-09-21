from app import types, models

import graphene


class Query(graphene.ObjectType):
    site = graphene.Field(types.SiteType)
    all_courts = graphene.List(types.CourtType)
    all_bookings = graphene.List(types.BookingType)
    bookings_by_court = graphene.List(types.BookingType, court_id=graphene.ID())
    bookings_by_user = graphene.List(types.BookingType, user_id=graphene.ID())
    session_info = graphene.Field(types.SessionInfoType)

    def resolve_site(self, info):
        return (
            models.Site.objects.first()
        )

    def resolve_all_courts(self, info):
        return (
            models.Court.objects.all()
        )

    def resolve_all_bookings(self, info):
        return (
            models.Booking.objects.all()
        )

    def resolve_bookings_by_court(self, info, court_id):
        return (
            models.Booking.objects.filter(court__pk=court_id)
        )

    def resolve_bookings_by_user(self, info, user_id):
        return (
            models.Booking.objects.filter(user__pk=user_id)
        )

    def resolve_session_info(self, info):
        user = info.context.user
        s = types.SessionInfoType()
        s.is_authenticated = user.is_authenticated
        s.user = user if user.is_authenticated else None
        return s
