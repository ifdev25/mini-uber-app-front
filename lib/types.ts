/**
 * Types TypeScript pour l'application Mini Uber
 * Basés sur les modèles de l'API Backend (API Platform)
 */

// ============================================
// User Types
// ============================================

export type UserType = 'passenger' | 'driver' | 'admin';

export interface User {
  '@context'?: string;
  '@id'?: string;
  '@type'?: string;
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
  usertype: UserType;
  rating: number;
  profilePictureUrl?: string | null;
  createdAt: string;
  driver?: Driver | null;
}

// ============================================
// Driver Types
// ============================================

export type VehicleType = 'standard' | 'premium' | 'suv';

export interface Driver {
  '@context'?: string;
  '@id'?: string;
  '@type'?: string;
  id: number;
  user: User | string; // Peut être un objet User ou une IRI "/api/users/1"
  vehiculeModel: string;
  vehiculeType: VehicleType;
  vehiculeColor: string;
  vehiculePlateNumber: string;
  licenceNumber: string;
  isAvailable: boolean;
  isVerified: boolean;
  currentLatitude: number;
  currentLongitude: number;
  rating: number;
  totalRides: number;
  createdAt: string;
}

// ============================================
// Ride Types
// ============================================

export type RideStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export interface Ride {
  '@context'?: string;
  '@id'?: string;
  '@type'?: string;
  id: number;
  passenger: User | string; // Objet User ou IRI
  driver?: Driver | string | null; // Objet Driver ou IRI
  pickupAddress: string;
  pickUpLatitude: number;
  pickUpLongitude: number;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  status: RideStatus;
  vehiculeType: VehicleType;
  estimatedPrice: number;
  finalPrice?: number | null;
  estimatedDuration: number; // en minutes
  estimatedDistance: number; // en km
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

// ============================================
// Ride Estimate Types
// ============================================

export interface RideEstimate {
  distance: number; // km
  duration: number; // minutes
  price: number; // €
  vehicleType: VehicleType;
}

// ============================================
// API Request/Response Types
// ============================================

// Registration
export interface RegisterData {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  phone: string;
  usertype: UserType;
}

// Login
export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

// Ride Estimate Request
export interface EstimateRideData {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  vehicleType: VehicleType;
}

// Create Ride Request
export interface CreateRideData {
  pickupAddress: string;
  pickUpLatitude: number;
  pickUpLongitude: number;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  vehiculeType: VehicleType;
}

// Update Ride Status
export interface UpdateRideStatusData {
  status: RideStatus;
}

// Update Driver Location
export interface UpdateDriverLocationData {
  lat: number;
  lng: number;
}

// Update Driver Availability
export interface UpdateDriverAvailabilityData {
  isAvailable: boolean;
}

// Create Driver Profile
export interface CreateDriverData {
  user: string; // IRI "/api/users/{id}"
  vehiculeModel: string;
  vehiculeType: VehicleType;
  vehiculeColor: string;
  vehiculePlateNumber: string;
  licenceNumber: string;
  currentLatitude: number;
  currentLongitude: number;
}

// ============================================
// API Platform Hydra Collection Types
// ============================================

export interface HydraCollection<T> {
  '@context': string;
  '@id': string;
  '@type': 'hydra:Collection';
  'hydra:member': T[];
  'hydra:totalItems': number;
  'hydra:view'?: {
    '@id': string;
    '@type': 'hydra:PartialCollectionView';
    'hydra:first'?: string;
    'hydra:last'?: string;
    'hydra:next'?: string;
    'hydra:previous'?: string;
  };
}

// ============================================
// API Error Types
// ============================================

export interface ApiError {
  '@context'?: string;
  '@type': 'hydra:Error';
  'hydra:title': string;
  'hydra:description': string;
  violations?: Violation[];
}

export interface Violation {
  propertyPath: string;
  message: string;
}

// ============================================
// Mercure Notification Types
// ============================================

export type MercureEventType =
  | 'ride_accepted'
  | 'ride_started'
  | 'ride_completed'
  | 'ride_cancelled'
  | 'driver_location'
  | 'new_ride';

export interface MercureNotification {
  type: MercureEventType;
  data: any;
}

// Specific notification data types
export interface RideAcceptedData {
  rideId: number;
  driver: Driver;
}

export interface RideStartedData {
  rideId: number;
}

export interface RideCompletedData {
  rideId: number;
  finalPrice: number;
}

export interface RideCancelledData {
  rideId: number;
  reason?: string;
}

export interface DriverLocationData {
  lat: number;
  lng: number;
}

export interface NewRideData {
  rideId: number;
  pickup: {
    address: string;
    lat: number;
    lng: number;
  };
  dropoff: {
    address: string;
    lat: number;
    lng: number;
  };
  price: number;
}

// ============================================
// Location & Geocoding Types
// ============================================

export interface Location {
  lat: number;
  lng: number;
}

export interface Address {
  formatted: string;
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface Place {
  address: Address;
  location: Location;
}

// ============================================
// Form Types
// ============================================

export interface NewRideFormData {
  pickupAddress: string;
  pickUpLatitude: number;
  pickUpLongitude: number;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  vehiculeType: VehicleType;
}

export interface ProfileFormData {
  firstname: string;
  lastname: string;
  phone: string;
  email: string;
  profilePictureUrl?: string;
}

export interface DriverProfileFormData {
  vehiculeModel: string;
  vehiculeType: VehicleType;
  vehiculeColor: string;
  vehiculePlateNumber: string;
  licenceNumber: string;
}

// ============================================
// Statistics Types
// ============================================

export interface PassengerStats {
  totalRides: number;
  averageRating: number;
  totalSpent: number;
}

export interface DriverStats {
  totalRides: number;
  averageRating: number;
  totalEarnings: number;
  totalDrivingTime: number; // en minutes
  ridesThisWeek: number;
  earningsThisWeek: number;
}
