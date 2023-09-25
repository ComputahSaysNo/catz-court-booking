from datetime import datetime, timedelta
from django.core.exceptions import ObjectDoesNotExist
import graphene
from app import models, types


class CreateBooking(graphene.Mutation):
    booking = graphene.Field(types.BookingType)

    class Arguments:
        date = graphene.Date(required=True)
        start_time = graphene.Time(required=True)
        end_time = graphene.Time(required=True)
        court_id = graphene.ID(required=True)
        description = graphene.String(required=False)

    def mutate(self, info, date, start_time, end_time, court_id, description=''):

        # All non-identity dependent validation
        def validate():

            # Check that start time is after end time
            if start_time >= end_time:
                raise ValueError("Start time must be before end time")

            # Check the court ID is valid
            try:
                court = models.Court.objects.get(id=court_id)
            except ObjectDoesNotExist:
                raise ValueError("Invalid Court ID")

            # Check the start and end time are within the opening hours of the court
            if start_time < court.opening_time:
                raise ValueError("Booking starts before the court opens")

            if end_time > court.closing_time:
                raise ValueError("Booking ends after the court closes")

            # Check the booking is not in the past
            if datetime.combine(date, start_time) < datetime.now():
                raise ValueError("Cannot make a booking in the past")

            # Check for overlaps with other bookings on that day and court
            potential_conflicts = models.Booking.objects.filter(court_id=court_id, date=date)
            for potential_conflict in potential_conflicts:
                print(potential_conflict)
                # Condition for A to overlap with B is (a.start < b.end) && (a.end > b.start)
                if (start_time < potential_conflict.end_time) and (end_time > potential_conflict.start_time):
                    raise ValueError("Booking clashes with existing booking: " + str(potential_conflict))

        # Validation dependent on user identity
        def check_authorisation():

            user = info.context.user
            if not user.is_authenticated:
                raise PermissionError("You must be logged in to create bookings")

            user_groups = [g.name.lower() for g in user.groups.all()]
            # Captains and admins may bypass the max booking and advance booking restrictions
            if "captain" not in user_groups and "admin" not in user_groups:

                FMT = '%H:%M:%S'
                duration = datetime.strptime(str(end_time), FMT) - datetime.strptime(str(start_time), FMT)
                court = models.Court.objects.get(id=court_id)

                if court.min_booking_length is not None:
                    if duration < court.min_booking_length:
                        raise ValueError(
                            f"Booking is too short: (Duration = {str(duration)} "
                            f"vs min court booking of {str(court.min_booking_length)}")

                if court.max_booking_length is not None:
                    if duration > court.max_booking_length:
                        raise ValueError(
                            f"Booking is too long: (Duration = {str(duration)} "
                            f"vs max court booking of {str(court.max_booking_length)}")

                if court.max_booking_days_in_advance is not None:
                    if date - datetime.now().date() > timedelta(days=court.max_booking_days_in_advance):
                        raise ValueError(
                            f"Booking is too far in advance ({(date - datetime.now().date()).days} days"
                            f", max allowed is {court.max_booking_days_in_advance} days)")


        validate()
        check_authorisation()

        booking = models.Booking(
            date=date,
            start_time=start_time,
            end_time=end_time,
            user_id=info.context.user.id,
            court_id=court_id,
            description=description
        )

        booking.save()
        return CreateBooking(booking=booking)


class Mutation(graphene.ObjectType):
    create_booking = CreateBooking.Field()
