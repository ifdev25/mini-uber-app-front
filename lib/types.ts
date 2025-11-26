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
  firstName: string;
  lastName: string;
  phone: string;
  userType: UserType;
  rating: number | null;
  profilePictureUrl?: string | null;
  createdAt?: string;  // API Platform pourrait utiliser created_at
  created_at?: string; // Fallback pour snake_case
  totalRides?: number;
  driver?: Driver | null;
  isVerified?: boolean;
}

// ============================================
// Driver Types
// ============================================

export type VehicleType = 'standard' | 'comfort' | 'premium' | 'suv';

export interface Driver {
  '@context'?: string;
  '@id'?: string;
  '@type'?: string;
  id: number;
  user: User | string; // Peut être un objet User ou une IRI "/api/users/1"
  vehicleModel: string; // Backend retourne vehicleModel (pas vehiculeModel)
  vehicleType: VehicleType; // Backend retourne vehicleType (pas vehiculeType)
  vehicleColor: string; // Backend retourne vehicleColor (pas vehiculeColor)
  licenceNumber: string;
  isAvailable?: boolean; // Optionnel car pas toujours retourné par l'API
  isVerified?: boolean;
  verifiedAt?: string;
  currentLatitude: number;
  currentLongitude: number;
  rating?: number;
  totalRides?: number;
  createdAt?: string;
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
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  status: RideStatus;
  vehicleType: VehicleType;
  estimatedPrice: number;
  finalPrice?: number | null;
  estimatedDuration: number; // en minutes
  estimatedDistance: number; // en km
  createdAt: string;
  acceptedAt?: string | null;
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
  firstName: string;
  lastName: string;
  phone: string;
  userType: UserType;
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
  passenger: string; // IRI du passager (ex: "/api/users/1")
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  vehicleType: VehicleType;
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

// Create Review/Rating
export interface CreateReviewData {
  ride: string; // IRI "/api/rides/{id}"
  rating: number; // 1-5
  comment?: string; // Optionnel
}

export interface Review {
  '@context'?: string;
  '@id'?: string;
  '@type'?: string;
  id: number;
  ride: Ride | string;
  reviewer: User | string; // L'utilisateur qui note
  reviewee: User | string; // L'utilisateur noté
  rating: number;
  comment?: string;
  createdAt: string;
}

// ============================================
// API Platform Hydra Collection Types
// ============================================

export interface HydraCollection<T> {
  '@context'?: string;
  '@id'?: string;
  '@type'?: 'hydra:Collection' | 'Collection';
  'hydra:member'?: T[]; // Certains endpoints retournent hydra:member
  member?: T[]; // D'autres retournent member
  'hydra:totalItems'?: number;
  totalItems?: number;
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
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  vehicleType: VehicleType;
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
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
