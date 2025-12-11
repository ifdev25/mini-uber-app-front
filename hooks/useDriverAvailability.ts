/**
 * Hook pour gérer la disponibilité du driver
 * Permet de changer le statut de disponibilité (disponible/non disponible)
 */

import { useApiMutation } from './useApiMutation';
import { api } from '@/lib/api';
import { Driver } from '@/lib/types';

/**
 * Hook pour mettre à jour la disponibilité du driver
 * Utilise React Query pour la gestion d'état cohérente avec les autres hooks
 */
export function useDriverAvailability() {
  return useApiMutation<Driver, boolean>({
    mutationFn: (isAvailable: boolean) => api.updateDriverAvailability(isAvailable),
    successMessage: (_, isAvailable) =>
      isAvailable
        ? '✅ Vous êtes maintenant disponible pour accepter des courses'
        : '⏸️ Vous êtes maintenant indisponible',
    errorContext: 'mise à jour de la disponibilité',
    invalidateQueries: [['auth', 'user'], ['drivers']],
  });
}
