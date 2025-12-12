/**
 * Client API pour l'application Mini Uber
 * Gestion des requêtes HTTP avec JWT Authentication
 */

import {
  User,
  Driver,
  Ride,
  RegisterData,
  RegisterResponse,
  LoginResponse,
  CreateRideData,
  CreateDriverData,
  CreateReviewData,
  Review,
  HydraCollection,
  ApiError,
  DriverHistoryResponse,
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
   * Retourne les données utilisateur
   * Note: Le backend renvoie déjà les données au format camelCase
   */
  private transformUserData(apiUser: any): User {
    return apiUser;
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
    // Sauf pour les endpoints custom non-API Platform comme /api/login et /api/ride-estimates
    const isCustomEndpoint = endpoint.includes('/login') ||
                              endpoint.includes('/ride-estimates') ||
                              endpoint.includes('/register');

    const defaultContentType = isCustomEndpoint ? 'application/json' : 'application/ld+json';

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
        console.error('❌ URL:', `${this.baseUrl}${endpoint}`);
        console.error('❌ Méthode:', options.method || 'GET');

        // Si 401, le token a expiré
        if (response.status === 401) {
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }

        // Tentative de parser l'erreur JSON
        let errorMessage = 'Une erreur est survenue';
        let errorDetails: any = null;
        try {
          const error: ApiError = await response.json();
          console.error('❌ Réponse d\'erreur du backend:', error);
          errorDetails = error;

          // Afficher les violations si elles existent
          if (error.violations && error.violations.length > 0) {
            const violationMessages = error.violations
              .map(v => `${v.propertyPath}: ${v.message}`)
              .join(', ');
            errorMessage = `Erreur de validation: ${violationMessages}`;
          } else {
            errorMessage = error['hydra:description'] || error['hydra:title'] || error.message || errorMessage;
          }

          // Améliorer les messages d'erreur spécifiques
          if (response.status === 403 && errorMessage.includes('Access Denied')) {
            errorMessage = 'Accès refusé. Veuillez vérifier votre email pour activer votre compte.';
          }
        } catch (parseError) {
          // Si pas de JSON, utiliser le status text
          console.error('❌ Impossible de parser la réponse JSON:', parseError);
          errorMessage = `Erreur ${response.status}: ${response.statusText}`;

          // Messages spécifiques pour les codes HTTP communs
          if (response.status === 403) {
            errorMessage = 'Accès refusé. Veuillez vérifier votre email pour activer votre compte.';
          }
        }

        console.error('❌ Message d\'erreur final:', errorMessage);
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
   * POST /api/register
   */
  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await this.request<RegisterResponse>('/api/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Stocker le token automatiquement
    this.setToken(response.token);

    // Transformer les données user pour assurer la compatibilité
    const transformedUser = this.transformUserData(response.user);

    return {
      ...response,
      user: transformedUser,
    };
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
   * Créer une nouvelle course
   * POST /api/rides
   */
  async createRide(data: CreateRideData): Promise<Ride> {
    try {
      const result = await this.request<Ride>('/api/rides', {
        method: 'POST',
        body: JSON.stringify(data),
      });
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
    const url = `/api/rides${params ? `?${params}` : ''}`;
    return this.request<HydraCollection<Ride>>(url);
  }

  /**
   * Récupérer une course par ID
   * GET /api/rides/{id}
   */
  async getRide(id: number): Promise<Ride> {
    return this.request<Ride>(`/api/rides/${id}`);
  }

  /**
   * Récupérer l'historique des courses du driver connecté
   * GET /api/driver/history
   * Endpoint optimisé qui retourne automatiquement les courses du driver authentifié
   */
  async getDriverHistory(filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<DriverHistoryResponse> {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const url = `/api/driver/history${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request<DriverHistoryResponse>(url);
  }

  /**
   * Accepter une course (chauffeur)
   * POST /api/rides/{id}/accept
   */
  async acceptRide(rideId: number): Promise<Ride> {
    try {
      const result = await this.request<Ride>(`/api/rides/${rideId}/accept`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      return result;
    } catch (error) {
      console.error('❌ Erreur lors de l\'acceptation de la course', rideId);
      console.error('❌ Détails de l\'erreur:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour le statut d'une course (chauffeur)
   * PATCH /api/rides/{id}/status
   */
  async updateRideStatus(rideId: number, status: string): Promise<Ride> {
    return this.request<Ride>(`/api/rides/${rideId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/merge-patch+json',
      },
      body: JSON.stringify({ status }),
    });
  }

  /**
   * Annuler une course (passager ou driver)
   * POST /api/rides/{id}/cancel
   */
  async cancelRide(rideId: number): Promise<Ride> {
    return this.request<Ride>(`/api/rides/${rideId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({}),
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
   * Identifie automatiquement le chauffeur via le token JWT
   */
  async updateDriverLocation(lat: number, lng: number): Promise<Driver | null> {
    try {
      return await this.request<Driver>('/api/drivers/location', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/merge-patch+json',
        },
        body: JSON.stringify({
          currentLatitude: lat,
          currentLongitude: lng,
        }),
      });
    } catch (error) {
      // Gérer silencieusement l'erreur 404 si l'endpoint n'existe pas encore dans le backend
      if (error instanceof Error && error.message.includes('404')) {
        console.warn('⚠️ Endpoint /api/drivers/location non implémenté dans le backend. Voir BACKEND_LOCATION_ENDPOINT_MISSING.md');
        return null;
      }
      // Re-throw les autres erreurs
      throw error;
    }
  }

  /**
   * Mettre à jour la disponibilité du chauffeur
   * PATCH /api/drivers/availability (préféré) ou PATCH /api/drivers/{id} (fallback)
   * Identifie automatiquement le chauffeur via le token JWT
   */
  async updateDriverAvailability(isAvailable: boolean): Promise<Driver> {
    try {
      // Essayer l'endpoint dédié d'abord
      return await this.request<Driver>('/api/drivers/availability', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/merge-patch+json',
        },
        body: JSON.stringify({ isAvailable }),
      });
    } catch (error) {
      // Si 404, utiliser le fallback PATCH /api/drivers/{id}
      const is404 = error instanceof Error &&
                    (error.message.includes('404') || error.message.includes('Not Found'));

      if (is404) {
        console.warn('⚠️ Endpoint /api/drivers/availability non implémenté. Utilisation du fallback.');

        // Récupérer l'ID du driver via /api/me
        const user = await this.getMe();
        if (!user.driverProfile?.id) {
          throw new Error('Driver profile not found for current user');
        }

        // Utiliser PATCH /api/drivers/{id}
        return await this.updateDriver(user.driverProfile.id, { isAvailable });
      }

      // Re-throw les autres erreurs
      throw error;
    }
  }

  /**
   * Mettre à jour un chauffeur
   * PATCH /api/drivers/{id}
   */
  async updateDriver(id: number, data: Partial<Driver>): Promise<Driver> {
    try {
      const result = await this.request<Driver>(`/api/drivers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/merge-patch+json',
        },
        body: JSON.stringify(data),
      });
      console.log('✅ Driver mis à jour:', result);
      return result;
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du driver:', error);
      console.error('❌ Données envoyées:', data);
      throw error;
    }
  }

  // ============================================
  // Reviews / Ratings
  // ============================================

  /**
   * Créer une notation/avis pour un chauffeur après une course
   * POST /api/ratings
   */
  async createReview(data: CreateReviewData): Promise<Review> {
    return this.request<Review>('/api/ratings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Récupérer les avis d'un utilisateur
   * GET /api/ratings
   */
  async getReviews(filters?: Record<string, any>): Promise<HydraCollection<Review>> {
    const params = new URLSearchParams(filters).toString();
    return this.request<HydraCollection<Review>>(
      `/api/ratings${params ? `?${params}` : ''}`
    );
  }
}

// Export d'une instance singleton du client API
export const api = new ApiClient();
