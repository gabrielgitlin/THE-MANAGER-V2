export interface TransportationProvider {
  id: string;
  name: string;
  type: 'airline' | 'bus' | 'train' | 'car_rental';
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  notes?: string;
}

export interface AccommodationProvider {
  id: string;
  name: string;
  type: 'hotel' | 'airbnb' | 'hostel' | 'other';
  address?: string;
  city?: string;
  country?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  notes?: string;
  amenities?: string[];
}

export interface TravelItinerary {
  id: string;
  showId: number;
  departureDate: string;
  departureTime?: string;
  departureLocation: string;
  arrivalDate: string;
  arrivalTime?: string;
  arrivalLocation: string;
  transportationType: 'flight' | 'bus' | 'train' | 'car';
  transportationProviderId?: string;
  confirmationNumber?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  passengers: string[]; // IDs of crew members
  notes?: string;
  cost?: number;
}

export interface AccommodationBooking {
  id: string;
  showId: number;
  providerId?: string;
  checkInDate: string;
  checkInTime?: string;
  checkOutDate: string;
  checkOutTime?: string;
  roomType?: string;
  numberOfRooms: number;
  confirmationNumber?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  guests: string[]; // IDs of crew members
  notes?: string;
  cost?: number;
  amenities?: string[];
}

export interface LogisticsOverview {
  showId: number;
  showTitle: string;
  showDate: string;
  showVenue: string;
  showCity: string;
  showCountry: string;
  travelItineraries: TravelItinerary[];
  accommodationBookings: AccommodationBooking[];
  totalTransportationCost: number;
  totalAccommodationCost: number;
}