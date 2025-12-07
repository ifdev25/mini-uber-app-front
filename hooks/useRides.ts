/**
 * Hook React Query pour la gestion des courses
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CreateRideData, Ride, HydraCollection, Driver } from '@/lib/types';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

/**
 * Hook pour créer une nouvelle course
 */
export function useCreateRide() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRideData) => {
      return api.createRide(data);
    },
    onSuccess: (ride: Ride) => {
      toast.success('Course créée avec succès ! Recherche d\'un chauffeur en cours...');

      // Invalider le cache des courses pour rafraîchir la liste
      queryClient.invalidateQueries({ queryKey: ['rides'] });

      // Rediriger vers la page de suivi de la course
      router.push(`/passenger/ride/${ride.id}`);
    },
    onError: (error: Error) => {
      console.error('❌ Erreur lors de la création de la course:', error);
      console.error('❌ Message d\'erreur:', error.message);
      console.error('❌ Stack:', error.stack);

      // Messages d'erreur personnalisés
      let userMessage = error.message;

      if (error.message.includes('vérifier votre email')) {
        userMessage = 'Vous devez vérifier votre email avant de pouvoir créer une course.';
      } else if (error.message.includes('403')) {
        userMessage = 'Vous devez vérifier votre email pour créer une course.';
      } else if (error.message.includes('401')) {
        userMessage = 'Vous devez être connecté pour créer une course.';
      }

      toast.error(userMessage);
    },
  });
}

/**
 * Hook pour récupérer la liste des courses de l'utilisateur
 */
export function useRides(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ['rides', filters],
    queryFn: () => api.getRides(filters),
  });
}

/**
 * Hook pour récupérer une course par ID
 * Active le rafraîchissement automatique pour détecter les changements de statut
 * Arrête automatiquement le polling quand la course est terminée ou annulée
 */
export function useRide(rideId: number) {
  return useQuery({
    queryKey: ['rides', rideId],
    queryFn: () => api.getRide(rideId),
    enabled: !!rideId,
    // Rafraîchir toutes les 3s uniquement si la course est active (pending, accepted, in_progress)
    refetchInterval: (query) => {
      const ride = query.state.data as Ride | undefined;
      // Arrêter le polling si la course est terminée ou annulée
      if (ride && (ride.status === 'completed' || ride.status === 'cancelled')) {
        return false; // Arrêter le polling
      }
      return 3000; // Continuer le polling toutes les 3 secondes
    },
    staleTime: 0, // Considérer les données comme obsolètes immédiatement
    gcTime: 0, // Ne pas garder les données en cache
    refetchOnWindowFocus: true, // Rafraîchir quand l'utilisateur revient sur l'onglet
    retry: 2, // Réessayer 2 fois en cas d'échec
  });
}

/**
 * Hook pour accepter une course (chauffeur)
 */
export function useAcceptRide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rideId: number) => api.acceptRide(rideId),
    onSuccess: (ride: Ride) => {
      toast.success('Course acceptée ! Dirigez-vous vers le point de départ.');
      // Invalider le cache de la course et de la liste des courses
      queryClient.invalidateQueries({ queryKey: ['rides', ride.id] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
    },
    onError: (error: Error) => {
      console.error('Failed to accept ride:', error);
      toast.error(error.message || 'Impossible d\'accepter la course.');
    },
  });
}

/**
 * Hook pour mettre à jour le statut d'une course (chauffeur)
 */
export function useUpdateRideStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rideId, status }: { rideId: number; status: string }) =>
      api.updateRideStatus(rideId, status),
    onSuccess: (ride: Ride) => {
      const statusMessages = {
        'in_progress': 'Course démarrée !',
        'completed': 'Course terminée avec succès !',
      };
      const message = statusMessages[ride.status as keyof typeof statusMessages] || 'Statut mis à jour.';
      toast.success(message);

      // Invalider le cache de la course et de la liste des courses
      queryClient.invalidateQueries({ queryKey: ['rides', ride.id] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
    },
    onError: (error: Error) => {
      console.error('Failed to update ride status:', error);
      toast.error(error.message || 'Impossible de mettre à jour le statut.');
    },
  });
}

/**
 * Hook pour annuler une course (passager)
 * Note: Fonctionne uniquement pour les courses avec status='pending'
 */
export function useCancelRide() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (rideId: number) => {
      return api.cancelRide(rideId);
    },
    onSuccess: (ride: Ride) => {
      toast.success('Course annulée avec succès');

      // Invalider le cache de la course et de la liste des courses
      queryClient.invalidateQueries({ queryKey: ['rides', ride.id] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });

      // Rediriger vers l'historique
      router.push('/passenger/history');
    },
    onError: (error: Error) => {
      console.error('❌ Erreur lors de l\'annulation:', error);
      console.error('❌ Message:', error.message);

      let message = error.message;

      // Messages d'erreur plus clairs
      if (message.includes('403') || message.includes('Forbidden')) {
        message = 'Seules les courses en attente ou acceptées peuvent être annulées.';
      } else if (message.includes('404')) {
        message = 'Course introuvable.';
      } else if (message.includes('401')) {
        message = 'Vous devez être connecté pour annuler une course.';
      }

      toast.error(message);
    },
  });
}

/**
 * Hook pour récupérer les chauffeurs disponibles
 * Note: On récupère tous les drivers car l'API ne retourne pas le champ isAvailable
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
    refetchInterval: 10000, // Rafraîchir toutes les 10 secondes
    retry: 2, // Réessayer 2 fois en cas d'échec
  });
}
