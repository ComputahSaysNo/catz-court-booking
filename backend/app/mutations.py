import graphene
from app import models, types


class CreateBooking(graphene.Mutation):
    booking = graphene.Field(types.BookingType)

    class Arguments:
        date = graphene.Date(required=True)
        start_time = graphene.Time(required=True)
        end_time = graphene.Time(required=True)
        user_id = graphene.ID(required=True)
        court_id = graphene.ID(required=True)
        description = graphene.String(required=False)

    def mutate(self, info, date, start_time, end_time, user_id, court_id, description=''):
        booking = models.Booking(
            date=date,
            start_time=start_time,
            end_time=end_time,
            user_id=user_id,
            court_id=court_id,
            description=description
        )
        booking.save()
        return CreateBooking(booking=booking)


class Mutation(graphene.ObjectType):
    create_booking = CreateBooking.Field()
