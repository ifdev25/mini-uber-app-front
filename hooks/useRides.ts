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
    // Polling intelligent : adapte la fréquence selon le statut et la visibilité de la page
    refetchInterval: (query) => {
      // Arrêter le polling si l'onglet n'est pas visible (économie de ressources)
      if (typeof document !== 'undefined' && document.hidden) {
        return false;
      }

      const ride = query.state.data as Ride | undefined;

      // Arrêter le polling si la course est terminée ou annulée
      if (ride && (ride.status === 'completed' || ride.status === 'cancelled')) {
        return false;
      }

      // Polling rapide pour les courses actives
      if (ride && (ride.status === 'in_progress' || ride.status === 'accepted')) {
        return 3000; // 3 secondes pour les courses actives
      }

      // Polling plus lent pour les courses en attente
      return 8000; // 8 secondes pour pending
    },
    staleTime: 2000, // Les données sont fraîches pendant 2s
    gcTime: 10000, // Garder en cache pendant 10s
    refetchOnWindowFocus: true, // Rafraîchir quand l'utilisateur revient sur l'onglet
    retry: 2, // Réessayer 2 fois en cas d'échec
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
