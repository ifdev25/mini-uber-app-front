/**
 * Types TypeScript pour l'application Mini Uber
 * Basés sur les modèles de l'API Backend (API Platform)
 */

// ============================================
// User Types
// ============================================

export type UserType = 'passenger' | 'driver' | 'admin';

// DriverProfile simplifié retourné par /api/me
export interface DriverProfile {
  id: number;
  vehicleModel: string;
  vehicleColor: string;
  vehicleType: VehicleType;
  isAvailable: boolean;
  currentLatitude: number;
  currentLongitude: number;
}

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
  driver?: Driver | null;  // Relation complète Driver (utilisée dans les rides)
  driverProfile?: DriverProfile | null;  // Profil simplifié retourné par /api/me
  isVerified?: boolean;
}

// ============================================
// Driver Types
// ============================================

export type VehicleType = 'standard' | 'comfort' | 'premium' | 'xl';

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
// Ride Estimate Types (Frontend only)
// ============================================

export interface RideEstimate {
  distance: number; // km
  duration: number; // minutes
  price: number; // €
  vehicleType?: VehicleType;
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

export interface RegisterResponse {
  message: string;
  user: User;
  token: string;
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
  estimatedPrice: number;
  estimatedDistance: number;
  estimatedDuration: number;
}

// Update Ride Status
// Create Driver Profile
export interface CreateDriverData {
  user: string; // IRI "/api/users/{id}"
  vehicleModel: string;
  vehicleType: VehicleType;
  vehicleColor: string;
  licenceNumber: string;
  currentLatitude: number;
  currentLongitude: number;
}

// Create Review/Rating
export interface CreateReviewData {
  ride: string; // IRI "/api/rides/{id}"
  rater: string; // IRI "/api/users/{id}" - L'utilisateur qui note
  rated: string; // IRI "/api/users/{id}" - L'utilisateur noté
  score: number; // 1-5
  comment?: string; // Optionnel
}

export interface Review {
  '@context'?: string;
  '@id'?: string;
  '@type'?: string;
  id: number;
  ride: Ride | string;
  rater: User | string; // L'utilisateur qui note
  rated: User | string; // L'utilisateur noté
  score: number;
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
  message?: string;
  violations?: Violation[];
}

export interface Violation {
  propertyPath: string;
  message: string;
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
// Driver History Endpoint Types
// ============================================

export interface DriverHistoryRide {
  id: number;
  status: RideStatus;
  passenger: {
    id: number;
    name: string;
    phone: string;
    rating: number;
  };
  pickup: {
    address: string;
    latitude: number;
    longitude: number;
  };
  dropoff: {
    address: string;
    latitude: number;
    longitude: number;
  };
  price: {
    estimated: number;
    final: number | null;
  };
  distance: number;
  duration: number;
  vehicleType: VehicleType;
  dates: {
    created: string;
    accepted: string | null;
    started: string | null;
    completed: string | null;
  };
}

export interface DriverHistoryResponse {
  success: boolean;
  data: DriverHistoryRide[];
  pagination: {
    limit: number;
    offset: number;
    count: number;
  };
}
