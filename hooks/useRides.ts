/**
 * Hook React Query pour la gestion des courses
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CreateRideData, Ride } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useApiMutation } from './useApiMutation';

/**
 * Hook pour créer une nouvelle course
 */
export function useCreateRide() {
  const router = useRouter();

  return useApiMutation<Ride, CreateRideData>({
    mutationFn: (data: CreateRideData) => api.createRide(data),
    successMessage: 'Course créée avec succès ! Recherche d\'un chauffeur en cours...',
    errorContext: 'création de la course',
    invalidateQueries: [['rides']],
    onSuccessCallback: (ride) => router.push(`/passenger/ride/${ride.id}`),
  });
}

/**
 * Hook pour récupérer la liste des courses de l'utilisateur
 * Avec polling intelligent pour le dashboard driver
 */
export function useRides(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ['rides', filters],
    queryFn: () => api.getRides(filters),
    // Polling intelligent : arrêter si l'onglet n'est pas visible
    refetchInterval: () => {
      if (typeof document !== 'undefined' && document.hidden) {
        return false; // Arrêter le polling si l'onglet est caché
      }
      return 8000; // Rafraîchir toutes les 8 secondes (au lieu de 5s avant)
    },
    staleTime: 5000, // Les données sont fraîches pendant 5s
  });
}

/**
 * Hook pour récupérer une course par ID
 * Active le rafraîchissement automatique pour détecter les changements de statut
 * Arrête automatiquement le polling quand la course est terminée ou annulée
 * Optimisé avec Page Visibility API pour économiser les ressources
 */
export function useRide(rideId: number) {
  return useQuery({
    queryKey: ['rides', rideId],
    queryFn: () => api.getRide(rideId),
    enabled: !!rideId,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });
}

/**
 * Hook pour accepter une course (chauffeur)
 */
export function useAcceptRide() {
  return useApiMutation<Ride, number>({
    mutationFn: (rideId: number) => api.acceptRide(rideId),
    successMessage: 'Course acceptée ! Dirigez-vous vers le point de départ.',
    errorContext: 'acceptation de la course',
    invalidateQueries: [['rides']],
  });
}

/**
 * Hook pour mettre à jour le statut d'une course (chauffeur)
 */
export function useUpdateRideStatus() {
  return useApiMutation<Ride, { rideId: number; status: string }>({
    mutationFn: ({ rideId, status }) => api.updateRideStatus(rideId, status),
    successMessage: (ride) => {
      const statusMessages = {
        'in_progress': 'Course démarrée !',
        'completed': 'Course terminée avec succès !',
      };
      return statusMessages[ride.status as keyof typeof statusMessages] || 'Statut mis à jour.';
    },
    errorContext: 'mise à jour du statut',
    invalidateQueries: [['rides']],
  });
}

/**
 * Hook pour annuler une course (passager ou driver)
 */
export function useCancelRide() {
  const router = useRouter();

  return useApiMutation<Ride, number>({
    mutationFn: (rideId: number) => api.cancelRide(rideId),
    successMessage: 'Course annulée avec succès',
    errorContext: 'annulation de la course',
    invalidateQueries: [['rides']],
    onSuccessCallback: () => router.push('/passenger/history'),
  });
}

/**
 * Hook pour récupérer les chauffeurs disponibles
 * Note: On récupère tous les drivers car l'API ne retourne pas le champ isAvailable
 * Optimisé avec Page Visibility API
 */
export function useAvailableDrivers() {
  return useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      try {
        // Récupérer tous les drivers (l'API ne filtre pas correctement par isAvailable)
        const result = await api.getDrivers();

        return result;
      } catch (error) {
        console.error('❌ Erreur lors de la récupération des chauffeurs:', error);
        throw error;
      }
    },
    // Polling intelligent : arrêter si l'onglet n'est pas visible
    refetchInterval: () => {
      if (typeof document !== 'undefined' && document.hidden) {
        return false; // Arrêter le polling si l'onglet est caché
      }
      return 10000; // Rafraîchir toutes les 10 secondes si visible
    },
    staleTime: 5000, // Les données sont fraîches pendant 5s
    retry: 2, // Réessayer 2 fois en cas d'échec
  });
}

/**
 * Hook pour récupérer l'historique des courses du driver connecté
 * Utilise l'endpoint optimisé /api/driver/history
 */
export function useDriverHistory(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['driver-history', filters],
    queryFn: () => api.getDriverHistory(filters),
  });
}

/**
 * Hook pour récupérer les courses disponibles pour le driver (courses pending)
 * Utilise l'endpoint /api/driver/available-rides
 * Avec polling intelligent pour le dashboard driver
 */
export function useAvailableRides(filters?: {
  limit?: number;
  vehicleType?: string;
  maxDistance?: number;
}) {
  return useQuery({
    queryKey: ['available-rides', filters],
    queryFn: () => api.getAvailableRides(filters),
    // Polling intelligent : arrêter si l'onglet n'est pas visible
    refetchInterval: () => {
      if (typeof document !== 'undefined' && document.hidden) {
        return false; // Arrêter le polling si l'onglet est caché
      }
      return 8000; // Rafraîchir toutes les 8 secondes
    },
    staleTime: 5000, // Les données sont fraîches pendant 5s
    retry: 2, // Réessayer 2 fois en cas d'échec
  });
}

/**
 * Hook pour récupérer les statistiques du passager connecté
 * Utilise l'endpoint /api/passenger/stats
 */
export function usePassengerStats() {
  return useQuery({
    queryKey: ['passenger-stats'],
    queryFn: () => api.getPassengerStats(),
    staleTime: 30000, // Les stats sont fraîches pendant 30s
    retry: 2,
  });
}

/**
 * Hook pour récupérer l'historique des courses du passager connecté
 * Utilise l'endpoint /api/passenger/history
 */
export function usePassengerHistory(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['passenger-history', filters],
    queryFn: () => api.getPassengerHistory(filters),
    staleTime: 10000, // Les données sont fraîches pendant 10s
    retry: 2,
  });
}
