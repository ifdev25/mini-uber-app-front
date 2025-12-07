import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Ride } from '@/lib/types';

/**
 * Hook pour récupérer l'historique des courses de l'utilisateur connecté
 * Utilise l'endpoint /api/my/rides qui filtre automatiquement selon le token JWT
 *
 * Avantages:
 * - Sécurité maximale: Le backend identifie l'utilisateur via le JWT
 * - Plus simple: Pas besoin de gérer driverId ou passengerId
 * - Évite la confusion entre user.id et driverProfile.id
 */
export function useMyRides() {
  const { data, error, isLoading } = useQuery<Ride[]>({
    queryKey: ['my-rides'],
    queryFn: () => api.request('/api/my/rides'),
    refetchOnWindowFocus: false,
  });

  return {
    rides: data || [],
    isLoading,
    error,
  };
}
