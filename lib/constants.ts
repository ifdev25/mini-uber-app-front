/**
 * Constantes globales pour l'application Mini Uber
 */

import { VehicleType, RideStatus } from './types';

// ============================================
// Vehicle Types Configuration
// ============================================

export const VEHICLE_TYPES: Record<VehicleType, {
  label: string;
  pricePerKm: number;
  basePrice: number;
  icon: string;
  description: string;
}> = {
  standard: {
    label: 'Standard',
    pricePerKm: 1.00,
    basePrice: 2.50,
    icon: '🚗',
    description: 'Voiture standard confortable',
  },
  comfort: {
    label: 'Confort',
    pricePerKm: 1.25,
    basePrice: 3.50,
    icon: '🚘',
    description: 'Véhicule confortable',
  },
  premium: {
    label: 'Premium',
    pricePerKm: 1.50,
    basePrice: 5.00,
    icon: '🚙',
    description: 'Véhicule haut de gamme',
  },
  xl: {
    label: 'XL',
    pricePerKm: 2.00,
    basePrice: 7.00,
    icon: '🚙',
    description: 'Grand véhicule spacieux',
  },
};

// ============================================
// Ride Status Configuration
// ============================================

export const RIDE_STATUS: Record<RideStatus, {
  label: string;
  color: string;
  icon: string;
  description: string;
}> = {
  pending: {
    label: 'En attente',
    color: 'yellow',
    icon: '⏳',
    description: 'Recherche d\'un chauffeur',
  },
  accepted: {
    label: 'Acceptée',
    color: 'blue',
    icon: '✅',
    description: 'Chauffeur en route',
  },
  in_progress: {
    label: 'En cours',
    color: 'green',
    icon: '🚗',
    description: 'Course en cours',
  },
  completed: {
    label: 'Terminée',
    color: 'gray',
    icon: '🏁',
    description: 'Course terminée',
  },
  cancelled: {
    label: 'Annulée',
    color: 'red',
    icon: '❌',
    description: 'Course annulée',
  },
};

// ============================================
// User Types Configuration
// ============================================

export const USER_TYPES = {
  passenger: {
    label: 'Passager',
    icon: '👤',
    description: 'Je veux réserver des courses',
  },
  driver: {
    label: 'Chauffeur',
    icon: '🚗',
    description: 'Je veux conduire et accepter des courses',
  },
  admin: {
    label: 'Admin',
    icon: '👨‍💼',
    description: 'Administrateur de la plateforme',
  },
} as const;

// ============================================
// API Configuration
// ============================================

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  TIMEOUT: 10000, // 10 secondes
  RETRY_ATTEMPTS: 3,
} as const;

// ============================================
// Map Configuration (Leaflet)
// ============================================

export const MAP_CONFIG = {
  DEFAULT_CENTER: {
    lat: 48.8566, // Paris
    lng: 2.3522,
  },
  DEFAULT_ZOOM: 13,
  MAX_ZOOM: 18,
  MIN_ZOOM: 3,
  TILE_LAYER_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  TILE_LAYER_ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
} as const;

// ============================================
// Polling & Real-time Configuration
// ============================================

export const POLLING_CONFIG = {
  RIDE_STATUS_INTERVAL: 5000, // 5 secondes
  DRIVER_LOCATION_INTERVAL: 5000, // 5 secondes
  PENDING_RIDES_INTERVAL: 10000, // 10 secondes
} as const;

// ============================================
// Mercure Configuration (Real-time notifications)
// ============================================

export const MERCURE_CONFIG = {
  HUB_URL: process.env.NEXT_PUBLIC_MERCURE_URL || 'http://localhost:3000/.well-known/mercure',
  BACKEND_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
} as const;

// ============================================
// Validation Rules
// ============================================

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  PHONE_REGEX: /^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PLATE_NUMBER_REGEX: /^[A-Z]{2}-\d{3}-[A-Z]{2}$/, // Format français AB-123-CD
} as const;

// ============================================
// Route Paths
// ============================================

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
} as const;

// ============================================
// Local Storage Keys
// ============================================

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  USER_DATA: 'user',
  LAST_LOCATION: 'lastLocation',
} as const;

// ============================================
// Error Messages
// ============================================

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion. Veuillez vérifier votre connexion Internet.',
  UNAUTHORIZED: 'Session expirée. Veuillez vous reconnecter.',
  FORBIDDEN: 'Vous n\'avez pas les permissions nécessaires.',
  NOT_FOUND: 'Ressource non trouvée.',
  VALIDATION_ERROR: 'Erreur de validation des données.',
  SERVER_ERROR: 'Erreur serveur. Veuillez réessayer plus tard.',
  GEOLOCATION_ERROR: 'Impossible d\'obtenir votre position.',
  GEOLOCATION_PERMISSION_DENIED: 'L\'accès à la géolocalisation a été refusé.',
} as const;

// ============================================
// Success Messages
// ============================================

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Connexion réussie !',
  REGISTER_SUCCESS: 'Inscription réussie ! Vous pouvez maintenant vous connecter.',
  RIDE_CREATED: 'Course créée avec succès !',
  RIDE_ACCEPTED: 'Course acceptée !',
  RIDE_STARTED: 'Course démarrée !',
  RIDE_COMPLETED: 'Course terminée !',
  RIDE_CANCELLED: 'Course annulée.',
  PROFILE_UPDATED: 'Profil mis à jour avec succès !',
  AVAILABILITY_UPDATED: 'Disponibilité mise à jour !',
} as const;

// ============================================
// Default Values
// ============================================

export const DEFAULT_VALUES = {
  USER_RATING: 5.0,
  DRIVER_RATING: 5.0,
  PAGE_SIZE: 20,
} as const;

// ============================================
// Rating Configuration
// ============================================

export const RATING_CONFIG = {
  MIN: 1,
  MAX: 5,
  STEP: 0.5,
  DEFAULT: 5,
} as const;
