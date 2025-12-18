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

/**
 * Erreur personnalisée pour les violations de validation
 * Permet de transmettre les erreurs de champ de manière structurée
 */
export class ValidationError extends Error {
  violations: Array<{ propertyPath: string; message: string }>;
  statusCode: number;

  constructor(
    message: string,
    violations: Array<{ propertyPath: string; message: string }>,
    statusCode: number = 422
  ) {
    super(message);
    this.name = 'ValidationError';
    this.violations = violations;
    this.statusCode = statusCode;
  }
}

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
    options: RequestInit & { silent?: boolean } = {}
  ): Promise<T> {
    const { silent, ...fetchOptions } = options;
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
        ...fetchOptions,
        headers,
        // Note: credentials: 'include' retiré car non requis par le backend
        // et peut causer des erreurs CORS si le backend n'est pas configuré pour
      });

      // Gérer les erreurs HTTP
      if (!response.ok) {
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
          errorDetails = error;

          // Gestion des erreurs de validation (422 avec violations)
          // Support de DEUX formats :
          // 1. Format /api/register : { violations: { email: "message", firstName: "message" } }
          // 2. Format API Platform : { violations: [{ propertyPath: "email", message: "message" }] }
          if (error.violations) {
            let normalizedViolations: Array<{ propertyPath: string; message: string }> = [];

            // Cas 1 : violations est un objet (format /api/register)
            if (typeof error.violations === 'object' && !Array.isArray(error.violations)) {
              normalizedViolations = Object.entries(error.violations).map(([field, message]) => ({
                propertyPath: field,
                message: message as string,
              }));
            }
            // Cas 2 : violations est un array (format API Platform)
            else if (Array.isArray(error.violations)) {
              normalizedViolations = error.violations;
            }

            if (normalizedViolations.length > 0) {
              // Lancer une ValidationError avec les violations structurées
              // Le message sera géré par le hook qui affiche les toasts
              throw new ValidationError(
                'Erreur de validation',
                normalizedViolations,
                response.status
              );
            }
          }

          // Si pas de violations, utiliser le message d'erreur standard
          errorMessage = error['hydra:description'] || error['hydra:title'] || error.message || errorMessage;

          // Améliorer les messages d'erreur spécifiques
          if (response.status === 403 && errorMessage.includes('Access Denied')) {
            errorMessage = 'Accès refusé. Veuillez vérifier votre email pour activer votre compte.';
          }
        } catch (parseError) {
          // Si c'est une ValidationError, la relancer
          if (parseError instanceof ValidationError) {
            throw parseError;
          }

          // Détecter si le backend a renvoyé du HTML au lieu du JSON
          if (parseError instanceof Error &&
              (parseError.message.includes('Unexpected token') ||
               parseError.message.includes('is not valid JSON') ||
               parseError.message.includes('JSON.parse'))) {
            errorMessage = 'Erreur serveur. Le backend a renvoyé une réponse invalide. Vérifiez les logs du serveur.';
          } else {
            // Si pas de JSON, utiliser le status text
            errorMessage = `Erreur ${response.status}: ${response.statusText}`;
          }

          // Messages spécifiques pour les codes HTTP communs
          if (response.status === 403) {
            errorMessage = 'Accès refusé. Veuillez vérifier votre email pour activer votre compte.';
          } else if (response.status === 500) {
            errorMessage = 'Erreur serveur interne. Vérifiez les logs du backend.';
          }
        }

        throw new Error(errorMessage);
      }

      // Retourner la réponse JSON
      return response.json();
    } catch (error: unknown) {
      // Gérer les erreurs réseau et de parsing
      if (error instanceof Error) {
        // Détecter les erreurs de parsing JSON (quand le backend renvoie du HTML)
        if (error.message.includes('Unexpected token') ||
            error.message.includes('is not valid JSON') ||
            error.message.includes('JSON.parse')) {
          throw new Error('Le serveur a renvoyé une réponse invalide. Vérifiez que le backend fonctionne correctement.');
        }
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
   * Récupérer les courses disponibles pour le driver (courses pending)
   * GET /api/driver/available-rides
   */
  async getAvailableRides(filters?: {
    limit?: number;
    vehicleType?: string;
    maxDistance?: number;
  }): Promise<{ success: boolean; data: Ride[]; count: number }> {
    const params = new URLSearchParams();

    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.vehicleType) params.append('vehicleType', filters.vehicleType);
    if (filters?.maxDistance) params.append('maxDistance', filters.maxDistance.toString());

    const url = `/api/driver/available-rides${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request<{ success: boolean; data: Ride[]; count: number }>(url);
  }

  /**
   * Récupérer les statistiques du passager connecté
   * GET /api/passenger/stats
   */
  async getPassengerStats(): Promise<{
    success: boolean;
    passenger: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      rating: number;
    };
    stats: {
      totalRides: number;
      completedRides: number;
      cancelledRides: number;
      totalSpent: number;
      averageRidePrice: number;
    };
  }> {
    return this.request('/api/passenger/stats');
  }

  /**
   * Récupérer l'historique des courses du passager connecté
   * GET /api/passenger/history
   */
  async getPassengerHistory(filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    success: boolean;
    data: any[];
    pagination: {
      limit: number;
      offset: number;
      count: number;
    };
  }> {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const url = `/api/passenger/history${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request(url);
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
        silent: true, // Désactiver les logs d'erreur (fonctionnalité optionnelle)
      });
    } catch (error) {
      // Gérer silencieusement TOUTES les erreurs de cet endpoint
      // car c'est une fonctionnalité optionnelle (suivi GPS en temps réel)
      // Si l'endpoint n'est pas implémenté côté backend, cela ne doit pas bloquer l'app
      return null;
    }
  }

  /**
   * Mettre à jour la disponibilité du chauffeur
   * PATCH /api/drivers/{id}
   * Note: L'endpoint /api/drivers/availability n'existe pas dans le backend
   * On utilise donc l'endpoint standard d'API Platform
   */
  async updateDriverAvailability(isAvailable: boolean): Promise<Driver> {
    // Récupérer l'ID du driver via /api/me
    const user = await this.getMe();
    if (!user.driverProfile?.id) {
      throw new Error('Profil chauffeur introuvable');
    }

    // Utiliser PATCH /api/drivers/{id} avec application/merge-patch+json
    return await this.updateDriver(user.driverProfile.id, { isAvailable });
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
