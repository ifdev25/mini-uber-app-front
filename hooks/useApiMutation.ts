/**
 * Hook générique pour les mutations API avec gestion d'erreur et toast
 * Factorisation de la logique commune à tous les hooks de mutations
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface UseApiMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  successMessage?: string | ((data: TData, variables: TVariables) => string);
  errorContext: string; // Ex: "création de la course", "mise à jour du profil"
  invalidateQueries?: string[][];
  onSuccessCallback?: (data: TData, variables: TVariables) => void;
}

/**
 * Hook généralisé pour les mutations avec gestion d'erreur et toast
 *
 * @example
 * ```typescript
 * const createRide = useApiMutation({
 *   mutationFn: api.createRide,
 *   successMessage: 'Course créée avec succès !',
 *   errorContext: 'création de la course',
 *   invalidateQueries: [['rides']],
 *   onSuccessCallback: (ride) => router.push(`/passenger/ride/${ride.id}`),
 * });
 *
 * // Utilisation
 * createRide.mutate(rideData);
 * ```
 */
export function useApiMutation<TData = unknown, TVariables = unknown>(
  options: UseApiMutationOptions<TData, TVariables>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: options.mutationFn,
    onSuccess: (data, variables) => {
      // Toast success
      if (options.successMessage) {
        const message =
          typeof options.successMessage === 'function'
            ? options.successMessage(data, variables)
            : options.successMessage;
        toast.success(message);
      }

      // Invalider les queries spécifiées pour rafraîchir les données
      options.invalidateQueries?.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });

      // Callback custom supplémentaire
      options.onSuccessCallback?.(data, variables);
    },
    onError: (error: Error) => {
      // Messages d'erreur standardisés basés sur le code HTTP
      let message = error.message;

      if (message.includes('403') || message.includes('Forbidden')) {
        message = 'Accès refusé. Vérifiez vos permissions.';
      } else if (message.includes('401') || message.includes('Unauthorized')) {
        message = 'Session expirée. Veuillez vous reconnecter.';
      } else if (message.includes('404') || message.includes('Not Found')) {
        message = 'Ressource introuvable.';
      } else if (message.includes('400') || message.includes('Bad Request')) {
        // Garder le message original pour les erreurs 400 car elles contiennent souvent des infos utiles
        message = message;
      } else if (message.includes('500') || message.includes('Internal Server Error')) {
        message = 'Erreur serveur. Veuillez réessayer plus tard.';
      }

      toast.error(message);
    },
  });
}
