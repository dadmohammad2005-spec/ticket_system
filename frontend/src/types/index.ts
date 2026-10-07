export type UserRole = 'ADMIN' | 'OPERATOR' | 'CUSTOMER';

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone_number?: string;
  id_card_number?: string;
  date_of_birth?: string;
  address?: string;
  profile_picture?: string;
  is_verified: boolean;
  is_active: boolean;
  date_joined: string;
}

export interface City {
  id: number;
  name: string;
  state_province?: string;
  country: number;
  country_name: string;
  code?: string;
  image_url?: string;
  is_popular: boolean;
}

export interface Station {
  id: number;
  name: string;
  code: string;
  city: number;
  city_name: string;
  address: string;
}

export interface Operator {
  id: number;
  name: string;
  slug: string;
  code: string;
  logo_url?: string;
  contact_email: string;
  contact_phone: string;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  cancellation_policy: string;
  terms_and_conditions: string;
}

export interface Vehicle {
  id: number;
  operator: number;
  operator_name: string;
  operator_logo?: string;
  vehicle_number: string;
  vehicle_type: 'BUS' | 'TRAIN' | 'FLIGHT' | 'FERRY';
  model_name: string;
  total_seats: number;
  total_rows: number;
  seats_per_row: number;
  amenities: string[];
}

export interface Seat {
  id: number;
  seat_number: string;
  row: number;
  column: number;
  deck: 'LOWER' | 'UPPER';
  seat_type: 'STANDARD' | 'WINDOW' | 'AISLE' | 'VIP' | 'SLEEPER';
  is_accessible: boolean;
  price_multiplier: number;
  price?: number;
  status: 'available' | 'selected' | 'booked' | 'locked' | 'disabled';
}

export interface Route {
  id: number;
  origin_city: number;
  destination_city: number;
  origin_city_detail: City;
  destination_city_detail: City;
  origin_station_detail?: Station;
  destination_station_detail?: Station;
  distance_km: number;
  estimated_duration_minutes: number;
  duration_formatted: string;
  is_popular: boolean;
}

export interface Trip {
  id: number;
  route: number;
  operator: number;
  vehicle: number;
  route_detail: Route;
  operator_detail: Operator;
  vehicle_detail: Vehicle;
  departure_time: string;
  arrival_time: string;
  duration_formatted: string;
  base_price: string | number;
  status: 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'COMPLETED' | 'CANCELLED';
  is_featured: boolean;
  available_seats_count: number;
  seats_layout?: Seat[];
  cancellation_reason?: string;
}

export interface BookingPassenger {
  id: number;
  seat: number;
  seat_number: string;
  full_name: string;
  id_card_number?: string;
  phone?: string;
  email?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  age?: number;
  price: string | number;
  ticket_number: string;
}

export interface Booking {
  id: number;
  booking_reference: string;
  user: number;
  user_email: string;
  trip: number;
  trip_detail: Trip;
  total_passengers: number;
  subtotal_amount: string | number;
  discount_amount: string | number;
  final_amount: string | number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
  payment_status: 'UNPAID' | 'PAID' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  contact_email: string;
  contact_phone: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  passengers?: BookingPassenger[];
  created_at: string;
}

export interface DigitalTicket {
  id: number;
  ticket_code: string;
  booking: number;
  booking_reference: string;
  passenger: number;
  passenger_name: string;
  seat_number: string;
  trip_id: number;
  origin_city: string;
  destination_city: string;
  departure_time: string;
  operator_name: string;
  qr_code_image?: string;
  qr_data?: string;
  is_validated: boolean;
  validated_at?: string;
}

export interface Review {
  id: number;
  user: number;
  user_name: string;
  trip: number;
  operator: number;
  operator_name: string;
  route_name: string;
  rating: number;
  cleanliness_rating: number;
  punctuality_rating: number;
  staff_rating: number;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SupportTicket {
  id: number;
  ticket_number: string;
  user: number;
  user_email: string;
  booking?: number;
  booking_reference?: string;
  subject: string;
  category: string;
  priority: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  created_at: string;
  updated_at: string;
  messages: {
    id: number;
    sender_name: string;
    sender_email: string;
    message: string;
    is_staff_reply: boolean;
    created_at: string;
  }[];
}

export interface Coupon {
  id: number;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: string | number;
  min_booking_amount: string | number;
  max_discount_amount?: string | number;
  valid_from: string;
  valid_to: string;
  usage_limit: number;
  times_used: number;
  is_active: boolean;
}
