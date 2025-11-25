/**
 * Hook React Query pour la gestion des courses
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CreateRideData, Ride, HydraCollection, Driver } from '@/lib/types';
import { useRouter } from 'next/navigation';

/**
 * Hook pour créer une nouvelle course
 */
export function useCreateRide() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRideData) => {
      console.log('🚀 Mutation createRide appelée avec:', data);
      return api.createRide(data);
    },
    onSuccess: (ride: Ride) => {
      console.log('✅ Course créée avec succès:', ride);
      // Invalider le cache des courses pour rafraîchir la liste
      queryClient.invalidateQueries({ queryKey: ['rides'] });

      // Rediriger vers la page de suivi de la course
      router.push(`/passenger/ride/${ride.id}`);
    },
    onError: (error: Error) => {
      console.error('❌ Erreur lors de la création de la course:', error);
      console.error('❌ Message d\'erreur:', error.message);
      console.error('❌ Stack:', error.stack);
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
 */
export function useRide(rideId: number) {
  return useQuery({
    queryKey: ['rides', rideId],
    queryFn: () => api.getRide(rideId),
    enabled: !!rideId,
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
      // Invalider le cache de la course et de la liste des courses
      queryClient.invalidateQueries({ queryKey: ['rides', ride.id] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
    },
    onError: (error: Error) => {
      console.error('Failed to accept ride:', error);
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
      // Invalider le cache de la course et de la liste des courses
      queryClient.invalidateQueries({ queryKey: ['rides', ride.id] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
    },
    onError: (error: Error) => {
      console.error('Failed to update ride status:', error);
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
      console.log('🔄 Tentative d\'annulation de la course', rideId);
      return api.cancelRide(rideId);
    },
    onSuccess: (ride: Ride) => {
      console.log('✅ Course annulée avec succès:', ride);
      // Invalider le cache de la course et de la liste des courses
      queryClient.invalidateQueries({ queryKey: ['rides', ride.id] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });

      // Afficher un message de succès
      alert('✅ Course annulée avec succès');

      // Rediriger vers l'historique
      router.push('/passenger/history');
    },
    onError: (error: Error) => {
      console.error('❌ Erreur lors de l\'annulation:', error);
      console.error('❌ Message:', error.message);

      let message = error.message;

      // Messages d'erreur plus clairs
      if (message.includes('403') || message.includes('Forbidden')) {
        message = 'Vous n\'êtes pas autorisé à annuler cette course. Seules les courses en attente (pending) peuvent être annulées.';
      } else if (message.includes('404')) {
        message = 'Course introuvable.';
      } else if (message.includes('401')) {
        message = 'Vous devez être connecté pour annuler une course.';
      }

      alert(`❌ Impossible d'annuler la course:\n${message}`);
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
      console.log('🔍 Récupération des chauffeurs...');
      try {
        // Récupérer tous les drivers (l'API ne filtre pas correctement par isAvailable)
        const result = await api.getDrivers();
        console.log('✅ Chauffeurs récupérés:', result);

        // Supporter les deux formats: member et hydra:member
        const drivers = result['hydra:member'] || result.member || [];
        console.log('📊 Nombre de chauffeurs:', drivers.length);

        // Afficher les coordonnées de chaque driver pour déboguer
        drivers.forEach((driver: Driver, index: number) => {
          console.log(`🚗 Driver ${index + 1}:`, {
            id: driver.id,
            lat: driver.currentLatitude,
            lng: driver.currentLongitude,
            vehicle: driver.vehicleModel
          });
        });

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
