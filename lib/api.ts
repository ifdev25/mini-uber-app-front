/**
 * Client API pour l'application Mini Uber
 * Gestion des requêtes HTTP avec JWT Authentication
 */

import {
  User,
  Driver,
  Ride,
  RideEstimate,
  RegisterData,
  LoginResponse,
  EstimateRideData,
  CreateRideData,
  UpdateRideStatusData,
  UpdateDriverLocationData,
  UpdateDriverAvailabilityData,
  CreateDriverData,
  CreateReviewData,
  Review,
  HydraCollection,
  ApiError,
} from './types';
import { API_CONFIG, STORAGE_KEYS } from './constants';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;

    // Initialiser le token depuis localStorage au démarrage (client-side only)
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    }
  }

  /**
   * Transforme les données utilisateur de l'API (lowercase) vers le format frontend (camelCase)
   */
  private transformUserData(apiUser: any): User {
    console.log('🔍 Données brutes de l\'API (avant transformation):', apiUser);

    const transformed = {
      ...apiUser,
      firstName: apiUser.firstname || apiUser.firstName,
      lastName: apiUser.lastname || apiUser.lastName,
      userType: apiUser.usertype || apiUser.userType,
      createdAt: apiUser.createdAt || apiUser.createdat || apiUser.created_at,
      totalRides: apiUser.totalRides || apiUser.totalrides,
      profilePictureUrl: apiUser.profilePictureUrl || apiUser.profilepictureurl,
      isVerified: apiUser.isVerified !== undefined ? apiUser.isVerified : apiUser.isverified,
    };

    console.log('✅ Données transformées:', transformed);
    return transformed;
  }

  /**
   * Stocke le token JWT
   */
  setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    }
  }

  /**
   * Récupère le token JWT
   */
  getToken(): string | null {
    if (typeof window !== 'undefined' && !this.token) {
      this.token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    }
    return this.token;
  }

  /**
   * Supprime le token JWT (déconnexion)
   */
  clearToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    }
  }

  /**
   * Méthode générique pour faire des requêtes HTTP
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Déterminer le Content-Type approprié
    // API Platform utilise application/ld+json par défaut
    // Sauf pour les endpoints custom comme /api/login
    const isApiPlatformEndpoint = !endpoint.includes('/login') &&
                                    !endpoint.includes('/ride-estimates') &&
                                    !endpoint.includes('/accept') &&
                                    !endpoint.includes('/status') &&
                                    !endpoint.includes('/location') &&
                                    !endpoint.includes('/availability');

    const defaultContentType = isApiPlatformEndpoint ? 'application/ld+json' : 'application/json';

    const headers: Record<string, string> = {
      'Content-Type': defaultContentType,
      ...(options.headers as Record<string, string>),
    };

    // Ajouter le token JWT si disponible
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      // Gérer les erreurs HTTP
      if (!response.ok) {
        console.error('❌ Erreur HTTP:', response.status, response.statusText);

        // Si 401, le token a expiré
        if (response.status === 401) {
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }

        // Tentative de parser l'erreur JSON
        let errorMessage = 'Une erreur est survenue';
        try {
          const error: ApiError = await response.json();
          console.error('❌ Réponse d\'erreur du backend:', error);

          // Afficher les violations si elles existent
          if (error.violations && error.violations.length > 0) {
            const violationMessages = error.violations
              .map(v => `${v.propertyPath}: ${v.message}`)
              .join(', ');
            errorMessage = `Erreur de validation: ${violationMessages}`;
          } else {
            errorMessage = error['hydra:description'] || error['hydra:title'] || errorMessage;
          }
        } catch {
          // Si pas de JSON, utiliser le status text
          errorMessage = `Erreur ${response.status}: ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      // Retourner la réponse JSON
      return response.json();
    } catch (error: unknown) {
      // Gérer les erreurs réseau
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erreur de connexion au serveur');
    }
  }

  // ============================================
  // Authentication & User
  // ============================================

  /**
   * Inscription d'un nouvel utilisateur
   * POST /api/users
   */
  async register(data: RegisterData): Promise<User> {
    const userData = await this.request<any>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return this.transformUserData(userData);
  }

  /**
   * Connexion
   * POST /api/login
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Stocker le token automatiquement
    this.setToken(response.token);

    return response;
  }

  /**
   * Récupérer le profil de l'utilisateur connecté
   * GET /api/me
   */
  async getMe(): Promise<User> {
    const userData = await this.request<any>('/api/me');
    return this.transformUserData(userData);
  }

  /**
   * Récupérer un utilisateur par ID
   * GET /api/users/{id}
   */
  async getUser(id: number): Promise<User> {
    const userData = await this.request<any>(`/api/users/${id}`);
    return this.transformUserData(userData);
  }

  /**
   * Récupérer la liste des utilisateurs
   * GET /api/users
   */
  async getUsers(filters?: Record<string, any>): Promise<HydraCollection<User>> {
    const params = new URLSearchParams(filters).toString();
    return this.request<HydraCollection<User>>(
      `/api/users${params ? `?${params}` : ''}`
    );
  }

  /**
   * Mettre à jour un utilisateur
   * PATCH /api/users/{id}
   */
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const userData = await this.request<any>(`/api/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/merge-patch+json',
      },
      body: JSON.stringify(data),
    });
    return this.transformUserData(userData);
  }

  // ============================================
  // Rides
  // ============================================

  /**
   * Estimer le prix d'une course
   * POST /api/ride-estimates
   */
  async estimateRide(data: EstimateRideData): Promise<RideEstimate> {
    return this.request<RideEstimate>('/api/ride-estimates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Créer une nouvelle course
   * POST /api/rides
   */
  async createRide(data: CreateRideData): Promise<Ride> {
    console.log('🌐 API createRide - Données envoyées:', data);
    console.log('🌐 API createRide - JSON:', JSON.stringify(data, null, 2));
    try {
      const result = await this.request<Ride>('/api/rides', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      console.log('✅ API createRide - Réponse reçue:', result);
      return result;
    } catch (error) {
      console.error('❌ API createRide - Erreur:', error);
      throw error;
    }
  }

  /**
   * Récupérer la liste des courses
   * GET /api/rides
   */
  async getRides(filters?: Record<string, any>): Promise<HydraCollection<Ride>> {
    const params = new URLSearchParams(filters).toString();
    return this.request<HydraCollection<Ride>>(
      `/api/rides${params ? `?${params}` : ''}`
    );
  }

  /**
   * Récupérer une course par ID
   * GET /api/rides/{id}
   */
  async getRide(id: number): Promise<Ride> {
    return this.request<Ride>(`/api/rides/${id}`);
  }

  /**
   * Accepter une course (chauffeur)
   * POST /api/rides/{id}/accept
   */
  async acceptRide(rideId: number): Promise<Ride> {
    return this.request<Ride>(`/api/rides/${rideId}/accept`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  /**
   * Mettre à jour le statut d'une course (chauffeur)
   * PATCH /api/rides/{id}/status
   */
  async updateRideStatus(rideId: number, status: string): Promise<Ride> {
    return this.request<Ride>(`/api/rides/${rideId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  /**
   * Annuler une course (passager)
   * PATCH /api/rides/{id}/status
   * Note: Le passager peut annuler quand status='pending'
   */
  async cancelRide(rideId: number): Promise<Ride> {
    console.log('🔄 Annulation de la course', rideId);
    return this.request<Ride>(`/api/rides/${rideId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled' }),
      headers: {
        'Content-Type': 'application/json', // /status utilise application/json
      },
    });
  }

  // ============================================
  // Drivers
  // ============================================

  /**
   * Récupérer la liste des chauffeurs
   * GET /api/drivers
   */
  async getDrivers(filters?: Record<string, any>): Promise<HydraCollection<Driver>> {
    const params = new URLSearchParams(filters).toString();
    return this.request<HydraCollection<Driver>>(
      `/api/drivers${params ? `?${params}` : ''}`
    );
  }

  /**
   * Récupérer un chauffeur par ID
   * GET /api/drivers/{id}
   */
  async getDriver(id: number): Promise<Driver> {
    return this.request<Driver>(`/api/drivers/${id}`);
  }

  /**
   * Créer un profil chauffeur
   * POST /api/drivers
   */
  async createDriver(data: CreateDriverData): Promise<Driver> {
    return this.request<Driver>('/api/drivers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Mettre à jour la position GPS du chauffeur
   * Note: Nécessite de récupérer l'ID du driver d'abord
   * PATCH /api/drivers/{id}
   */
  async updateDriverLocation(lat: number, lng: number): Promise<Driver> {
    // Récupérer l'utilisateur connecté pour obtenir l'ID
    const user = await this.getMe();

    // Récupérer la liste des drivers pour trouver celui correspondant à cet utilisateur
    const driversResponse = await this.getDrivers();
    const drivers = driversResponse['hydra:member'] || driversResponse.member || [];

    // Trouver le driver correspondant à l'utilisateur connecté
    const currentDriver = drivers.find((driver: Driver) => {
      if (typeof driver.user === 'object' && driver.user) {
        return driver.user.id === user.id;
      }
      return false;
    });

    if (!currentDriver) {
      throw new Error('Profil chauffeur introuvable');
    }

    // Mettre à jour la position
    return this.updateDriver(currentDriver.id, {
      currentLatitude: lat,
      currentLongitude: lng,
    });
  }

  /**
   * Mettre à jour la disponibilité du chauffeur
   * Note: Nécessite de récupérer l'ID du driver d'abord
   * PATCH /api/drivers/{id}
   */
  async updateDriverAvailability(isAvailable: boolean): Promise<Driver> {
    // Récupérer l'utilisateur connecté pour obtenir l'ID
    const user = await this.getMe();

    // Récupérer la liste des drivers pour trouver celui correspondant à cet utilisateur
    const driversResponse = await this.getDrivers();
    const drivers = driversResponse['hydra:member'] || driversResponse.member || [];

    // Trouver le driver correspondant à l'utilisateur connecté
    const currentDriver = drivers.find((driver: Driver) => {
      if (typeof driver.user === 'object' && driver.user) {
        return driver.user.id === user.id;
      }
      return false;
    });

    if (!currentDriver) {
      throw new Error('Profil chauffeur introuvable');
    }

    // Mettre à jour la disponibilité
    return this.updateDriver(currentDriver.id, { isAvailable });
  }

  /**
   * Mettre à jour un chauffeur
   * PATCH /api/drivers/{id}
   */
  async updateDriver(id: number, data: Partial<Driver>): Promise<Driver> {
    return this.request<Driver>(`/api/drivers/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/merge-patch+json',
      },
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // Reviews / Ratings
  // ============================================

  /**
   * Créer une notation/avis pour un chauffeur après une course
   * POST /api/reviews
   */
  async createReview(data: CreateReviewData): Promise<Review> {
    console.log('📝 Création d\'une notation:', data);
    return this.request<Review>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Récupérer les avis d'un utilisateur
   * GET /api/reviews
   */
  async getReviews(filters?: Record<string, any>): Promise<HydraCollection<Review>> {
    const params = new URLSearchParams(filters).toString();
    return this.request<HydraCollection<Review>>(
      `/api/reviews${params ? `?${params}` : ''}`
    );
  }
}

// Export d'une instance singleton du client API
export const api = new ApiClient();
