import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.locations.models import Country, City, Station
from apps.routes.models import Route
from apps.trips.models import Trip, SeatLock
from apps.bookings.models import Booking, BookingPassenger
from apps.tickets.models import DigitalTicket
from apps.payments.models import Payment

def delete_foreign_data():
    foreign_countries = Country.objects.exclude(code='PK')
    foreign_cities = City.objects.filter(country__in=foreign_countries) | City.objects.exclude(country__code='PK')

    print(f"Found {foreign_countries.count()} foreign countries: {list(foreign_countries.values_list('name', flat=True))}")
    print(f"Found {foreign_cities.count()} foreign cities: {list(foreign_cities.values_list('name', flat=True))}")

    # Find routes involving foreign cities
    foreign_routes = Route.objects.filter(origin_city__in=foreign_cities) | Route.objects.filter(destination_city__in=foreign_cities)
    print(f"Found {foreign_routes.count()} foreign routes")

    # Find trips involving foreign routes
    foreign_trips = Trip.objects.filter(route__in=foreign_routes)
    print(f"Found {foreign_trips.count()} foreign trips")

    # Find bookings on foreign trips
    foreign_bookings = Booking.objects.filter(trip__in=foreign_trips)
    print(f"Found {foreign_bookings.count()} foreign bookings")

    # Delete related tickets, passengers, payments for foreign bookings
    DigitalTicket.objects.filter(booking__in=foreign_bookings).delete()
    BookingPassenger.objects.filter(booking__in=foreign_bookings).delete()
    Payment.objects.filter(booking__in=foreign_bookings).delete()
    foreign_bookings.delete()

    # Delete seat locks and trips
    SeatLock.objects.filter(trip__in=foreign_trips).delete()
    foreign_trips.delete()

    # Delete foreign routes
    foreign_routes.delete()

    # Delete foreign stations
    foreign_stations = Station.objects.filter(city__in=foreign_cities)
    print(f"Found {foreign_stations.count()} foreign stations")
    foreign_stations.delete()

    # Delete foreign cities
    deleted_cities_count, _ = foreign_cities.delete()
    print(f"Deleted {deleted_cities_count} foreign city records")

    # Delete foreign countries
    deleted_countries_count, _ = foreign_countries.delete()
    print(f"Deleted {deleted_countries_count} foreign country records")

    # Verify remaining countries and cities
    remaining_countries = list(Country.objects.values_list('name', 'code'))
    remaining_cities_count = City.objects.count()
    print(f"Remaining countries in database: {remaining_countries}")
    print(f"Total remaining cities in database (all Pakistan): {remaining_cities_count}")

if __name__ == '__main__':
    delete_foreign_data()
