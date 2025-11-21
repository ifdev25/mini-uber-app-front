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

    const headers: HeadersInit = {
      'Content-Type': defaultContentType,
      ...options.headers,
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
        // Tentative de parser l'erreur JSON
        let error: ApiError;
        try {
          error = await response.json();
        } catch {
          // Si pas de JSON, créer une erreur générique
          error = {
            '@type': 'hydra:Error',
            'hydra:title': 'Erreur HTTP',
            'hydra:description': `Erreur ${response.status}: ${response.statusText}`,
          };
        }

        // Si 401, le token a expiré
        if (response.status === 401) {
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }

        throw new Error(error['hydra:description'] || 'Une erreur est survenue');
      }

      // Retourner la réponse JSON
      return response.json();
    } catch (error) {
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
    return this.request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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
    return this.request<User>('/api/me');
  }

  /**
   * Récupérer un utilisateur par ID
   * GET /api/users/{id}
   */
  async getUser(id: number): Promise<User> {
    return this.request<User>(`/api/users/${id}`);
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
    return this.request<User>(`/api/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/merge-patch+json',
      },
      body: JSON.stringify(data),
    });
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
    return this.request<Ride>('/api/rides', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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
   * Mettre à jour le statut d'une course
   * PATCH /api/rides/{id}/status
   */
  async updateRideStatus(rideId: number, status: string): Promise<Ride> {
    return this.request<Ride>(`/api/rides/${rideId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
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
   * PATCH /api/drivers/location
   */
  async updateDriverLocation(lat: number, lng: number): Promise<Driver> {
    return this.request<Driver>('/api/drivers/location', {
      method: 'PATCH',
      body: JSON.stringify({ lat, lng }),
    });
  }

  /**
   * Mettre à jour la disponibilité du chauffeur
   * PATCH /api/drivers/availability
   */
  async updateDriverAvailability(isAvailable: boolean): Promise<Driver> {
    return this.request<Driver>('/api/drivers/availability', {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable }),
    });
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
}

// Export d'une instance singleton du client API
export const api = new ApiClient();
